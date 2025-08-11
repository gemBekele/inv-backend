import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Company } from './entities/company.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { createMockRepository } from '../../../test/setup';

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepository: jest.Mocked<Repository<Company>>;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;

  const mockCompany = {
    id: '1',
    name: 'Test Company',
    address: '123 Company St',
    phoneNumber: '12345678',
    email: 'company@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWarehouse = {
    id: '1',
    name: 'Main Warehouse',
    location: '456 Warehouse Ave',
    company: mockCompany,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    companyRepository = module.get(getRepositoryToken(Company));
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new company successfully', async () => {
      const createCompanyDto = {
        name: 'Test Company',
        address: '123 Company St',
        warehouseIds: ['warehouse-1'],
      };

      const companyWithWarehouses = {
        ...mockCompany,
        warehouses: [mockWarehouse],
      };

      companyRepository.findOne.mockResolvedValueOnce(null) // First call for existence check
        .mockResolvedValueOnce(companyWithWarehouses as any); // Second call for relations
      companyRepository.create.mockReturnValue(mockCompany as any);
      companyRepository.save.mockResolvedValue(mockCompany as any);
      warehouseRepository.findBy.mockResolvedValue([mockWarehouse] as any);
      warehouseRepository.save.mockResolvedValue(mockWarehouse as any);

      const result = await service.create(createCompanyDto);

      expect(companyRepository.create).toHaveBeenCalledWith({
        name: createCompanyDto.name,
        address: createCompanyDto.address,
      });
      expect(warehouseRepository.findBy).toHaveBeenCalledWith({ id: In(['warehouse-1']) });
      expect(result).toEqual(expect.objectContaining({
        name: mockCompany.name,
        address: mockCompany.address,
      }));
    });

    it('should throw ConflictException if company name already exists', async () => {
      const createCompanyDto = {
        name: 'Test Company',
        address: '123 Company St',
        warehouseIds: ['warehouse-1'],
      };

      companyRepository.findOne.mockResolvedValue(mockCompany as any);

      await expect(service.create(createCompanyDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      const query = {
        search: 'Test',
      };
      const mockCompanies = [{ ...mockCompany, warehouses: [] }];
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCompanies, mockCompanies.length]),
      };

      companyRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(query);

      expect(companyRepository.createQueryBuilder).toHaveBeenCalledWith('company');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('company.warehouses', 'warehouses');
      expect(queryBuilder.where).toHaveBeenCalledWith('company.name LIKE :search OR company.address LIKE :search', { search: '%Test%' });
      expect(result).toEqual(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: mockCompany.name })
        ]),
        total: mockCompanies.length,
      }));
    });
  });

  describe('findOne', () => {
    it('should find a company by ID', async () => {
      companyRepository.findOne.mockResolvedValue(mockCompany as any);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.objectContaining({ name: mockCompany.name }));
    });

    it('should throw NotFoundException if company not found', async () => {
      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  // Add additional tests for update, remove, addWarehouses, etc.

});

