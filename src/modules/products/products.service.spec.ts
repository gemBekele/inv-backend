import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '../../shared/cache/cache.service';
import { ProductType } from './enums';
import { ProductQueryDto } from './dto';
import { createMockRepository } from '../../../test/setup';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    sku: 'PROD-001',
    barcode: '12345678',
    type: 'STANDARD',
    trackStock: true,
    stockQuantity: 50,
    minStockLevel: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository(),
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            deletePattern: jest.fn(),
            generateKey: jest.fn((...args: any[]) => args.join('_')),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const createProductDto = {
        name: 'New Product',
        price: 100,
        sku: 'NEW-001',
        type: ProductType.PRODUCT,
        category: 'Electronics',
        unit: 'pcs',
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockProduct as any);
      repository.save.mockResolvedValue(mockProduct as any);
      cacheService.deletePattern.mockResolvedValue(1);

      const result = await service.create(createProductDto);

      expect(repository.create).toHaveBeenCalledWith(createProductDto);
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
      expect(cacheService.deletePattern).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        name: mockProduct.name,
        price: mockProduct.price,
      }));
    });

    it('should throw ConflictException if SKU already exists', async () => {
      const createProductDto = {
        name: 'Existing SKU',
        price: 100,
        sku: 'EXIST-001',
        type: ProductType.PRODUCT,
        category: 'Electronics',
        unit: 'pcs',
      };

      repository.findOne.mockResolvedValue(mockProduct as any);

      await expect(service.create(createProductDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query = Object.assign(new ProductQueryDto(), {
        page: 1,
        limit: 10,
        search: 'Test',
      });
      const mockProducts = [mockProduct];
      
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockProducts, mockProducts.length]),
      };

      // Mock cache miss
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue();
      
      repository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: '%Test%' }
      );
      expect(result).toEqual(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: mockProduct.name })
        ]),
        total: mockProducts.length,
      }));
    });
  });

  describe('findOne', () => {
    it('should find a product by ID', async () => {
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue();
      repository.findOne.mockResolvedValue(mockProduct as any);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.objectContaining({ name: mockProduct.name }));
    });

    it('should throw NotFoundException if product not found', async () => {
      cacheService.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  // Add additional tests for update, remove, findByBarcode, etc.

});

