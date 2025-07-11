import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, CustomerResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
	const existingCustomer = await this.customerRepository.findOne({ where: [
	  { phoneNumber: createCustomerDto.phoneNumber },
	  { name: createCustomerDto.name },
	] });
	if (existingCustomer) {
 	  throw new ConflictException('Customer with this phone number or name already exists');
	}
    const customer = this.customerRepository.create(createCustomerDto);
    const savedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(savedCustomer);
  }

  async findAll(query: CustomerQueryDto): Promise<PaginatedResult<CustomerResponseDto>> {
    const { search } = query;
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');
    if (search) {
      queryBuilder.where('customer.name LIKE :search OR customer.phoneNumber LIKE :search', { search: `%${search}%` });
    }
    const [customers, total] = await queryBuilder
      .skip(0)
      .take(10)
      .getManyAndCount();
    return {
      data: customers.map(this.mapToResponseDto),
      total,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(total / 10),
    };
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.mapToResponseDto(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.mapToResponseDto(updatedCustomer);
  }

  async remove(id: string): Promise<void> {
    const result = await this.customerRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Customer not found');
  }

//   async addLoyaltyPoints(id: string, points: number): Promise<CustomerResponseDto> {
//     const customer = await this.customerRepository.findOne({ where: { id } });
//     if (!customer) throw new NotFoundException('Customer not found');
//     customer.loyaltyPoints += points;
//     const updatedCustomer = await this.customerRepository.save(customer);
//     return this.mapToResponseDto(updatedCustomer);
//   }

  private mapToResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      status: customer.status,
    //   loyaltyPoints: customer.loyaltyPoints,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}