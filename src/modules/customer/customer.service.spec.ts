import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { createMockRepository } from '../../../test/setup';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: jest.Mocked<Repository<Customer>>;

  const mockCustomer = {
    id: '1',
    name: 'Test Customer',
    phoneNumber: '12345678',
    address: '123 Customer St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const createCustomerDto = { 
        name: 'New Customer', 
        phoneNumber: '99999999', 
        address: '321 Customer Ave',
      };

      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue(mockCustomer as any);
      customerRepository.save.mockResolvedValue(mockCustomer as any);

      const result = await service.create(createCustomerDto);

      expect(customerRepository.create).toHaveBeenCalledWith(createCustomerDto);
      expect(customerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual(expect.objectContaining({
        name: mockCustomer.name,
        phoneNumber: mockCustomer.phoneNumber,
      }));
    });

    it('should throw ConflictException if customer phone or name already exists', async () => {
      const createCustomerDto = { 
        name: 'Test Customer', 
        phoneNumber: '12345678', 
      };

      customerRepository.findOne.mockResolvedValue(mockCustomer as any);

      await expect(service.create(createCustomerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const query = { search: 'test' };
      const mockCustomers = [mockCustomer];

      customerRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, mockCustomers.length]),
      } as any);

      const result = await service.findAll(query);

      expect(result).toEqual(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: mockCustomer.name })
        ]),
        total: mockCustomers.length,
      }));
    });
  });

  describe('findOne', () => {
    it('should find a customer by ID', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer as any);

      const result = await service.findOne('1');

      expect(result).toEqual(expect.objectContaining({ name: mockCustomer.name }));
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  // Add additional tests for update, remove, etc.

});
