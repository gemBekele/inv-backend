import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from './warehouse.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Product } from '../products/entities/product.entity';
import { WarehouseProduct } from './entities/warehouse-product.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Shop } from '../shops/entities/shops.entity';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { createMockRepository } from '../../../test/setup';
import { UserRole } from '@/common/enums';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let warehouseProductRepository: jest.Mocked<Repository<WarehouseProduct>>;
  let companyRepository: jest.Mocked<Repository<Company>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let shopRepository: jest.Mocked<Repository<Shop>>;

  const mockCompany = {
    id: '1',
    name: 'Test Company',
    address: '123 Company St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: '1',
    firstName: 'Test',
    lastName: 'Manager',
    email: 'manager@test.com',
    role: UserRole.ADMIN,
    fullName: 'Test Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWarehouse = {
    id: '1',
    name: 'Main Warehouse',
    location: '456 Warehouse Ave',
    description: 'Main warehouse location',
    capacity: 1000,
    company: mockCompany,
    manager: mockUser,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    sku: 'PROD-001',
    type: 'STANDARD',
    category: 'Electronics',
    unit: 'pcs',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWarehouseProduct = {
    id: '1',
    warehouse: mockWarehouse,
    product: mockProduct,
    stockQuantity: 50,
    minStockLevel: 10,
    salesQuantity: 0,
    salesRevenue: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(WarehouseProduct),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Company),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Shop),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
    productRepository = module.get(getRepositoryToken(Product));
    warehouseProductRepository = module.get(getRepositoryToken(WarehouseProduct));
    companyRepository = module.get(getRepositoryToken(Company));
    userRepository = module.get(getRepositoryToken(User));
    shopRepository = module.get(getRepositoryToken(Shop));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new warehouse successfully', async () => {
      const createWarehouseDto = {
        name: 'New Warehouse',
        location: '789 New Location',
        companyId: '1',
        managerId: '1',
      };

      companyRepository.findOne.mockResolvedValue(mockCompany as any);
      userRepository.findOne.mockResolvedValue(mockUser as any);
      warehouseRepository.create.mockReturnValue(mockWarehouse as any);
      warehouseRepository.save.mockResolvedValue(mockWarehouse as any);

      const result = await service.create(createWarehouseDto);

      expect(companyRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(warehouseRepository.create).toHaveBeenCalledWith({
        name: createWarehouseDto.name,
        location: createWarehouseDto.location,
        company: mockCompany,
        manager: mockUser,
      });
      expect(result).toEqual(expect.objectContaining({
        name: mockWarehouse.name,
        location: mockWarehouse.location,
      }));
    });

    it('should throw NotFoundException if company not found', async () => {
      const createWarehouseDto = {
        name: 'New Warehouse',
        location: '789 New Location',
        companyId: 'nonexistent',
      };

      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createWarehouseDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if manager not found', async () => {
      const createWarehouseDto = {
        name: 'New Warehouse',
        location: '789 New Location',
        companyId: '1',
        managerId: 'nonexistent',
      };

      companyRepository.findOne.mockResolvedValue(mockCompany as any);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createWarehouseDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated warehouses', async () => {
      const query = { page: 1, limit: 10 };
      const mockWarehouses = [mockWarehouse];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockWarehouses, mockWarehouses.length]),
      };

      warehouseRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ name: mockWarehouse.name })
        ]),
        total: mockWarehouses.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should find a warehouse by ID with products', async () => {
      const warehouseWithProducts = {
        ...mockWarehouse,
        products: [mockWarehouseProduct],
      };

      warehouseRepository.findOne.mockResolvedValue(warehouseWithProducts as any);

      const result = await service.findOne('1');

      expect(warehouseRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['products', 'products.product'],
      });
      expect(result).toEqual(expect.objectContaining({
        name: mockWarehouse.name,
        products: expect.any(Array),
      }));
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      warehouseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('attachProduct', () => {
    it('should attach a product to warehouse successfully', async () => {
      const attachProductDto = {
        productId: '1',
        stockQuantity: 100,
        minStockLevel: 10,
      };

      warehouseRepository.findOne.mockResolvedValue(mockWarehouse as any);
      productRepository.findOne.mockResolvedValue(mockProduct as any);
      warehouseProductRepository.findOne.mockResolvedValue(null);
      warehouseProductRepository.create.mockReturnValue(mockWarehouseProduct as any);
      warehouseProductRepository.save.mockResolvedValue(mockWarehouseProduct as any);

      await service.attachProduct('1', attachProductDto);

      expect(warehouseRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(warehouseProductRepository.create).toHaveBeenCalledWith({
        warehouse: mockWarehouse,
        product: mockProduct,
        stockQuantity: 100,
        minStockLevel: 10,
      });
      expect(warehouseProductRepository.save).toHaveBeenCalledWith(mockWarehouseProduct);
    });

    it('should throw ConflictException if product already attached', async () => {
      const attachProductDto = {
        productId: '1',
        stockQuantity: 100,
        minStockLevel: 10,
      };

      warehouseRepository.findOne.mockResolvedValue(mockWarehouse as any);
      productRepository.findOne.mockResolvedValue(mockProduct as any);
      warehouseProductRepository.findOne.mockResolvedValue(mockWarehouseProduct as any);

      await expect(service.attachProduct('1', attachProductDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProductStock', () => {
    it('should update product stock in warehouse', async () => {
      warehouseProductRepository.findOne.mockResolvedValue(mockWarehouseProduct as any);
      warehouseProductRepository.save.mockResolvedValue({
        ...mockWarehouseProduct,
        stockQuantity: 75,
      } as any);

      await service.updateProductStock('1', '1', 75);

      expect(warehouseProductRepository.findOne).toHaveBeenCalledWith({
        where: { warehouse: { id: '1' }, product: { id: '1' } },
      });
      expect(warehouseProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 75 })
      );
    });

    it('should throw NotFoundException if product not found in warehouse', async () => {
      warehouseProductRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProductStock('1', '1', 75)).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordSale', () => {
    it('should record a sale and update stock', async () => {
      const mockWarehouseProductWithStock = {
        ...mockWarehouseProduct,
        stockQuantity: 50,
        salesQuantity: 0,
        salesRevenue: 0,
      };

      warehouseProductRepository.findOne.mockResolvedValue(mockWarehouseProductWithStock as any);
      warehouseProductRepository.save.mockResolvedValue(mockWarehouseProduct as any);

      await service.recordSale('1', '1', 10, 1000);

      expect(warehouseProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 40,
          salesQuantity: 10,
          salesRevenue: 1000,
          lastSaleDate: expect.any(Date),
        })
      );
    });

    it('should throw ConflictException if insufficient stock', async () => {
      const lowStockWarehouseProduct = {
        ...mockWarehouseProduct,
        stockQuantity: 5,
      };

      warehouseProductRepository.findOne.mockResolvedValue(lowStockWarehouseProduct as any);

      await expect(service.recordSale('1', '1', 10, 1000)).rejects.toThrow(ConflictException);
    });
  });
});
