import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Sales } from '../sales/entities/sales.entity';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../../test/setup';

describe('CommissionService', () => {
  let service: CommissionService;
  let commissionRepository: jest.Mocked<Repository<Commission>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let salesRepository: jest.Mocked<Repository<Sales>>;

  const mockEmployee = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    sku: 'PROD-001',
  };

  const mockSale = {
    id: '1',
    total: 1000,
  };

  const mockCommission = {
    id: '1',
    employee: mockEmployee,
    product: mockProduct,
    sale: mockSale,
    commissionRate: 10,
    commissionAmount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        {
          provide: getRepositoryToken(Commission),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Sales),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    commissionRepository = module.get(getRepositoryToken(Commission));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(Product));
    salesRepository = module.get(getRepositoryToken(Sales));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new commission successfully', async () => {
      const createCommissionDto = {
        employeeId: '1',
        productId: '1',
        saleId: '1',
        commissionRate: 10,
        commissionAmount: 100,
      };

      userRepository.findOne.mockResolvedValue(mockEmployee as any);
      productRepository.findOne.mockResolvedValue(mockProduct as any);
      salesRepository.findOne.mockResolvedValue(mockSale as any);
      commissionRepository.create.mockReturnValue(mockCommission as any);
      commissionRepository.save.mockResolvedValue(mockCommission as any);

      const result = await service.create(createCommissionDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(salesRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(commissionRepository.create).toHaveBeenCalledWith({
        employee: mockEmployee,
        product: mockProduct,
        sale: mockSale,
        commissionRate: 10,
        commissionAmount: 100,
      });
      expect(commissionRepository.save).toHaveBeenCalledWith(mockCommission);
      expect(result).toEqual(mockCommission);
    });
  });

  describe('findAll', () => {
    it('should return all commissions', async () => {
      const mockCommissions = [mockCommission];
      commissionRepository.find.mockResolvedValue(mockCommissions as any);

      const result = await service.findAll();

      expect(commissionRepository.find).toHaveBeenCalledWith({ relations: ['employee', 'product', 'sale'] });
      expect(result).toEqual(mockCommissions);
    });
  });

  describe('findByEmployee', () => {
    it('should find commissions by employee ID', async () => {
      const mockCommissions = [mockCommission];
      commissionRepository.find.mockResolvedValue(mockCommissions as any);

      const result = await service.findByEmployee('1');

      expect(commissionRepository.find).toHaveBeenCalledWith({
        where: { employee: { id: '1' } },
        relations: ['employee', 'product', 'sale'],
      });
      expect(result).toEqual(mockCommissions);
    });
  });
});
