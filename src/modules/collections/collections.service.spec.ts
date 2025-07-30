import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Supplier } from './entities/supplier.entity';
import { ProductGroup } from './entities/product-group.entity';
import { Product } from '../products/entities/product.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMockRepository, createMockPaginationResult } from '../../../test/setup';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let branchRepository: jest.Mocked<Repository<Branch>>;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let productGroupRepository: jest.Mocked<Repository<ProductGroup>>;
  let productRepository: jest.Mocked<Repository<Product>>;

  const mockBranch = {
    id: '1',
    name: 'Main Branch',
    address: '123 Main St',
    phoneNumber: '+1234567890',
    email: 'main@example.com',
    manager: 'John Manager',
    description: 'Main branch location',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSupplier = {
    id: '1',
    name: 'Test Supplier',
    contactPerson: 'Jane Doe',
    email: 'supplier@example.com',
    phoneNumber: '+1234567890',
    address: '456 Supplier St',
    description: 'Test supplier description',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test product description',
    sku: 'TEST-001',
    price: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductGroup = {
    id: '1',
    name: 'Test Group',
    description: 'Test product group',
    isActive: true,
    products: [mockProduct],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: getRepositoryToken(Branch),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ProductGroup),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    branchRepository = module.get(getRepositoryToken(Branch));
    supplierRepository = module.get(getRepositoryToken(Supplier));
    productGroupRepository = module.get(getRepositoryToken(ProductGroup));
    productRepository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Branch Management', () => {
    describe('createBranch', () => {
      it('should create a new branch successfully', async () => {
        const createBranchDto = {
          name: 'New Branch',
          address: '789 New St',
          phoneNumber: '+1987654321',
          email: 'new@example.com',
          manager: 'New Manager',
          description: 'New branch location',
        };

        branchRepository.findOne.mockResolvedValue(null);
        branchRepository.create.mockReturnValue(mockBranch as any);
        branchRepository.save.mockResolvedValue(mockBranch as any);

        const result = await service.createBranch(createBranchDto);

        expect(branchRepository.findOne).toHaveBeenCalledWith({
          where: { name: createBranchDto.name },
        });
        expect(branchRepository.create).toHaveBeenCalledWith(createBranchDto);
        expect(branchRepository.save).toHaveBeenCalledWith(mockBranch);
        expect(result).toEqual(expect.objectContaining({
          name: mockBranch.name,
          address: mockBranch.address,
        }));
      });

      it('should throw ConflictException if branch name already exists', async () => {
        const createBranchDto = {
          name: 'Existing Branch',
          address: '789 New St',
        };

        branchRepository.findOne.mockResolvedValue(mockBranch as any);

        await expect(service.createBranch(createBranchDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('findAllBranches', () => {
      it('should return paginated branches', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
        };
        const mockBranches = [mockBranch];

        branchRepository.findAndCount.mockResolvedValue([
          mockBranches as any[],
          mockBranches.length,
        ]);

        const result = await service.findAllBranches(query);

        expect(branchRepository.findAndCount).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 10,
        });
        expect(result).toEqual({
          data: expect.arrayContaining([
            expect.objectContaining({ name: mockBranch.name }),
          ]),
          total: mockBranches.length,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(mockBranches.length / query.limit),
        });
      });

      it('should apply search filter when provided', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
          search: 'Main',
        };
        const mockBranches = [mockBranch];

        branchRepository.findAndCount.mockResolvedValue([
          mockBranches as any[],
          mockBranches.length,
        ]);

        const result = await service.findAllBranches(query);

        expect(branchRepository.findAndCount).toHaveBeenCalledWith({
          where: { name: 'Main' },
          skip: 0,
          take: 10,
        });
      });
    });
  });

  describe('Supplier Management', () => {
    describe('createSupplier', () => {
      it('should create a new supplier successfully', async () => {
        const createSupplierDto = {
          name: 'New Supplier',
          contact: '+1987654321',
          contactPerson: 'John Contact',
          email: 'newsupplier@example.com',
          address: '789 Supplier Ave',
          description: 'New supplier description',
        };

        supplierRepository.create.mockReturnValue(mockSupplier as any);
        supplierRepository.save.mockResolvedValue(mockSupplier as any);

        const result = await service.createSupplier(createSupplierDto);

        expect(supplierRepository.create).toHaveBeenCalledWith(createSupplierDto);
        expect(supplierRepository.save).toHaveBeenCalledWith(mockSupplier);
        expect(result).toEqual(expect.objectContaining({
          name: mockSupplier.name,
          contactPerson: mockSupplier.contactPerson,
        }));
      });
    });

    describe('findAllSuppliers', () => {
      it('should return paginated suppliers', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
        };
        const mockSuppliers = [mockSupplier];

        supplierRepository.findAndCount.mockResolvedValue([
          mockSuppliers as any[],
          mockSuppliers.length,
        ]);

        const result = await service.findAllSuppliers(query);

        expect(supplierRepository.findAndCount).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 10,
        });
        expect(result).toEqual({
          data: expect.arrayContaining([
            expect.objectContaining({ name: mockSupplier.name }),
          ]),
          total: mockSuppliers.length,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(mockSuppliers.length / query.limit),
        });
      });

      it('should apply search filter when provided', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
          search: 'Test',
        };
        const mockSuppliers = [mockSupplier];

        supplierRepository.findAndCount.mockResolvedValue([
          mockSuppliers as any[],
          mockSuppliers.length,
        ]);

        const result = await service.findAllSuppliers(query);

        expect(supplierRepository.findAndCount).toHaveBeenCalledWith({
          where: { name: 'Test' },
          skip: 0,
          take: 10,
        });
      });
    });
  });

  describe('Product Group Management', () => {
    describe('createProductGroup', () => {
      it('should create a new product group successfully', async () => {
        const createProductGroupDto = {
          name: 'New Group',
          description: 'New product group',
          productIds: ['1'],
        };

        productGroupRepository.create.mockReturnValue(mockProductGroup as any);
        productRepository.findByIds.mockResolvedValue([mockProduct] as any[]);
        productGroupRepository.save.mockResolvedValue(mockProductGroup as any);

        const result = await service.createProductGroup(createProductGroupDto);

        expect(productRepository.findByIds).toHaveBeenCalledWith(['1']);
        expect(productGroupRepository.create).toHaveBeenCalledWith({
          name: createProductGroupDto.name,
          description: createProductGroupDto.description,
        });
        expect(productGroupRepository.save).toHaveBeenCalledWith(mockProductGroup);
        expect(result).toEqual(expect.objectContaining({
          name: mockProductGroup.name,
          description: mockProductGroup.description,
        }));
      });

      it('should create product group without products', async () => {
        const createProductGroupDto = {
          name: 'New Group',
          description: 'New product group',
        };

        const groupWithoutProducts = { ...mockProductGroup, products: [] };
        productGroupRepository.create.mockReturnValue(groupWithoutProducts as any);
        productGroupRepository.save.mockResolvedValue(groupWithoutProducts as any);

        const result = await service.createProductGroup(createProductGroupDto);

        expect(productRepository.findByIds).not.toHaveBeenCalled();
        expect(productGroupRepository.create).toHaveBeenCalledWith(createProductGroupDto);
        expect(result).toEqual(expect.objectContaining({
          name: groupWithoutProducts.name,
          description: groupWithoutProducts.description,
        }));
      });
    });

    describe('findAllProductGroups', () => {
      it('should return paginated product groups', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
        };
        const mockGroups = [mockProductGroup];

        productGroupRepository.findAndCount.mockResolvedValue([
          mockGroups as any[],
          mockGroups.length,
        ]);

        const result = await service.findAllProductGroups(query);

        expect(productGroupRepository.findAndCount).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 10,
        });
        expect(result).toEqual({
          data: expect.arrayContaining([
            expect.objectContaining({ name: mockProductGroup.name }),
          ]),
          total: mockGroups.length,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(mockGroups.length / query.limit),
        });
      });

      it('should apply search filter when provided', async () => {
        const query = {
          page: 1,
          limit: 10,
          skip: 0,
          search: 'Test',
        };
        const mockGroups = [mockProductGroup];

        productGroupRepository.findAndCount.mockResolvedValue([
          mockGroups as any[],
          mockGroups.length,
        ]);

        const result = await service.findAllProductGroups(query);

        expect(productGroupRepository.findAndCount).toHaveBeenCalledWith({
          where: { name: 'Test' },
          skip: 0,
          take: 10,
        });
      });
    });
  });
});
