import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { BaseMultiTenantService } from '../../common/services/base-multi-tenant.service';
import { User } from '../users/entities/user.entity';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerQueryDto, 
  CustomerResponseDto,
  UpdateCreditLimitDto,
  ApproveCreditDto,
  UpdateCreditRatingDto,
  UpdateCreditBalanceDto,
  ToggleCreditSalesDto,
  CreditStatsResponseDto,
  CustomerCreditHistoryDto
} from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { CustomerStatus } from './enums/customer-status.enum';

@Injectable()
export class CustomerService extends BaseMultiTenantService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super();
  }

  async create(createCustomerDto: CreateCustomerDto, user?: User): Promise<CustomerResponseDto> {
    // Set company context if user is provided
    let finalCompanyId = createCustomerDto.companyId;
    if (user) {
      const contextData = this.setCompanyContext({ companyId: createCustomerDto.companyId }, user);
      finalCompanyId = contextData.companyId;
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      companyId: finalCompanyId,
      availableCredit: (createCustomerDto.creditLimit || 0) - (createCustomerDto.currentCreditBalance || 0)
    });
    
    try {
      const savedCustomer = await this.customerRepository.save(customer);
      return this.mapToResponseDto(savedCustomer);
    } catch (error) {
      if (error.code === '23505' && error.constraint?.includes('phoneNumber')) {
        throw new ConflictException('Customer with this phone number already exists in your company');
      }
      throw error;
    }
  }

  async findAll(query: CustomerQueryDto, user?: User): Promise<PaginatedResult<CustomerResponseDto>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      creditRating, 
      isCreditApproved, 
      allowCreditSales,
      isOverCreditLimit,
      hasOverduePayments
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.creditSales', 'creditSales');
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'customer');
    }

    // Text search
    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.phoneNumber LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    // Credit rating filter
    if (creditRating) {
      queryBuilder.andWhere('customer.creditRating = :creditRating', { creditRating });
    }

    // Credit approval filter
    if (isCreditApproved !== undefined) {
      queryBuilder.andWhere('customer.isCreditApproved = :isCreditApproved', { isCreditApproved });
    }

    // Credit sales allowed filter
    if (allowCreditSales !== undefined) {
      queryBuilder.andWhere('customer.allowCreditSales = :allowCreditSales', { allowCreditSales });
    }

    // Over credit limit filter
    if (isOverCreditLimit !== undefined) {
      if (isOverCreditLimit) {
        queryBuilder.andWhere('customer.currentCreditBalance > customer.creditLimit');
      } else {
        queryBuilder.andWhere('customer.currentCreditBalance <= customer.creditLimit');
      }
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('customer.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: customers.map(customer => this.mapToResponseDto(customer)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string, user?: User): Promise<CustomerResponseDto> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.creditSales', 'creditSales')
      .where('customer.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'customer');
    }
    
    const customer = await queryBuilder.getOne();
    if (!customer) throw new NotFoundException('Customer not found');
    return this.mapToResponseDto(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: ['creditSales']
    });
    if (!customer) throw new NotFoundException('Customer not found');
    
    // Check for phone number conflict if phone number is being updated
    if (updateCustomerDto.phoneNumber && updateCustomerDto.phoneNumber !== customer.phoneNumber) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { phoneNumber: updateCustomerDto.phoneNumber }
      });
      if (existingCustomer) {
        throw new ConflictException('Customer with this phone number already exists');
      }
    }

    // Update customer with provided data
    Object.assign(customer, updateCustomerDto);
    
    // Recalculate available credit if credit limit or current balance changes
    if (updateCustomerDto.creditLimit !== undefined || updateCustomerDto.currentCreditBalance !== undefined) {
      customer.availableCredit = customer.creditLimit - customer.currentCreditBalance;
    }
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({ 
      where: { id },
      relations: ['creditSales']
    });
    if (!customer) throw new NotFoundException('Customer not found');
    
    // Check if customer has outstanding credit balance
    if (customer.currentCreditBalance > 0) {
      throw new BadRequestException('Cannot delete customer with outstanding credit balance');
    }

    // Soft delete by setting status to DELETED
    customer.status = CustomerStatus.DELETED;
    await this.customerRepository.save(customer);
  }

  // Credit Management Methods
  async updateCreditLimit(id: string, updateCreditLimitDto: UpdateCreditLimitDto): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.creditLimit = updateCreditLimitDto.creditLimit;
    customer.availableCredit = customer.creditLimit - customer.currentCreditBalance;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async approveCredit(id: string, approveCreditDto: ApproveCreditDto): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.creditLimit = approveCreditDto.creditLimit;
    customer.creditRating = approveCreditDto.creditRating;
    customer.paymentTermsDays = approveCreditDto.paymentTermsDays;
    customer.interestRate = approveCreditDto.interestRate;
    customer.creditNotes = approveCreditDto.creditNotes;
    customer.isCreditApproved = true;
    customer.creditApprovedDate = new Date();
    customer.allowCreditSales = true;
    customer.availableCredit = customer.creditLimit - customer.currentCreditBalance;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async updateCreditRating(id: string, updateCreditRatingDto: UpdateCreditRatingDto): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.creditRating = updateCreditRatingDto.creditRating;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async updateCreditBalance(id: string, updateCreditBalanceDto: UpdateCreditBalanceDto): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.currentCreditBalance = updateCreditBalanceDto.currentCreditBalance;
    customer.availableCredit = customer.creditLimit - customer.currentCreditBalance;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async toggleCreditSales(id: string, toggleCreditSalesDto: ToggleCreditSalesDto): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.allowCreditSales = toggleCreditSalesDto.allowCreditSales;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async suspendCredit(id: string): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    
    customer.allowCreditSales = false;
    customer.status = CustomerStatus.SUSPENDED;
    
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async getCreditStats(): Promise<CreditStatsResponseDto> {
    const allCustomers = await this.customerRepository.find({
      relations: ['creditSales']
    });

    const creditCustomers = allCustomers.filter(c => c.creditLimit > 0);
    const approvedCreditCustomers = creditCustomers.filter(c => c.isCreditApproved);
    const customersOverLimit = creditCustomers.filter(c => c.isOverCreditLimit);
    const customersWithOverdue = creditCustomers.filter(c => c.hasOverduePayments);

    const totalCreditLimit = creditCustomers.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalCreditBalance = creditCustomers.reduce((sum, c) => sum + c.currentCreditBalance, 0);
    const totalAvailableCredit = creditCustomers.reduce((sum, c) => sum + c.availableCredit, 0);
    const totalOverdueAmount = creditCustomers.reduce((sum, c) => sum + c.totalOverdueAmount, 0);
    
    const avgCreditUtilization = creditCustomers.length > 0 
      ? creditCustomers.reduce((sum, c) => sum + c.creditUtilization, 0) / creditCustomers.length 
      : 0;

    return {
      totalCreditCustomers: creditCustomers.length,
      approvedCreditCustomers: approvedCreditCustomers.length,
      totalCreditLimit,
      totalCreditBalance,
      totalAvailableCredit,
      customersOverLimit: customersOverLimit.length,
      customersWithOverdue: customersWithOverdue.length,
      totalOverdueAmount,
      averageCreditUtilization: avgCreditUtilization
    };
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { phoneNumber },
      relations: ['creditSales']
    });
  }

  async getCreditEligibleCustomers(): Promise<CustomerResponseDto[]> {
    const customers = await this.customerRepository.find({
      where: {
        status: CustomerStatus.ACTIVE,
        allowCreditSales: true,
        isCreditApproved: true
      },
      relations: ['creditSales']
    });

    return customers
      .filter(customer => customer.canCreateCreditSale)
      .map(customer => this.mapToResponseDto(customer));
  }

  private async findCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['creditSales']
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  private mapToResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      status: customer.status,
      metadata: customer.metadata,
      creditLimit: customer.creditLimit,
      currentCreditBalance: customer.currentCreditBalance,
      availableCredit: customer.availableCredit,
      creditRating: customer.creditRating,
      paymentTermsDays: customer.paymentTermsDays,
      isCreditApproved: customer.isCreditApproved,
      creditApprovedDate: customer.creditApprovedDate,
      interestRate: customer.interestRate,
      allowCreditSales: customer.allowCreditSales,
      creditNotes: customer.creditNotes,
      companyId: customer.companyId,
      canCreateCreditSale: customer.canCreateCreditSale,
      creditUtilization: customer.creditUtilization,
      isOverCreditLimit: customer.isOverCreditLimit,
      remainingCreditLimit: customer.remainingCreditLimit,
      creditScore: customer.creditScore,
      totalOverdueAmount: customer.totalOverdueAmount,
      hasOverduePayments: customer.hasOverduePayments,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}