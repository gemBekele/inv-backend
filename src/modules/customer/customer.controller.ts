import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CurrentUser } from '../../common/decorators';
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
  CreditStatsResponseDto
} from './dto';
import { IsInt, Min } from 'class-validator';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard } from '@/common/guards';

class AddLoyaltyPointsDto {
  @ApiProperty({ description: 'Points to add' })
  @IsInt()
  @Min(1)
  points: number;
}

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
@UseGuards(JwtAuthGuard)

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 409, description: 'Customer with phone number already exists' })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: User
  ): Promise<CustomerResponseDto> {
    return this.customerService.create(createCustomerDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of customers with pagination', schema: {
    allOf: [
      {
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/CustomerResponseDto' }
          },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
          totalPages: { type: 'number' },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' }
        }
      }
    ]
  }})
  async findAll(
    @Query() query: CustomerQueryDto,
    @CurrentUser() user: User
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    return this.customerService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer details', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<CustomerResponseDto> {
    return this.customerService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer by ID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a customer by ID (sets status to DELETED)' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete customer with outstanding credit balance' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customerService.remove(id);
  }

  // Credit Management Endpoints
  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  @ApiBody({ type: UpdateCreditLimitDto })
  @ApiResponse({ status: 200, description: 'Credit limit updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCreditLimit(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCreditLimitDto: UpdateCreditLimitDto
  ): Promise<CustomerResponseDto> {
    return this.customerService.updateCreditLimit(id, updateCreditLimitDto);
  }

  @Post(':id/approve-credit')
  @ApiOperation({ summary: 'Approve credit for customer' })
  @ApiBody({ type: ApproveCreditDto })
  @ApiResponse({ status: 200, description: 'Credit approved successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async approveCredit(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() approveCreditDto: ApproveCreditDto
  ): Promise<CustomerResponseDto> {
    return this.customerService.approveCredit(id, approveCreditDto);
  }

  @Patch(':id/credit-rating')
  @ApiOperation({ summary: 'Update customer credit rating' })
  @ApiBody({ type: UpdateCreditRatingDto })
  @ApiResponse({ status: 200, description: 'Credit rating updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCreditRating(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCreditRatingDto: UpdateCreditRatingDto
  ): Promise<CustomerResponseDto> {
    return this.customerService.updateCreditRating(id, updateCreditRatingDto);
  }

  @Patch(':id/credit-balance')
  @ApiOperation({ summary: 'Update customer credit balance' })
  @ApiBody({ type: UpdateCreditBalanceDto })
  @ApiResponse({ status: 200, description: 'Credit balance updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCreditBalance(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCreditBalanceDto: UpdateCreditBalanceDto
  ): Promise<CustomerResponseDto> {
    return this.customerService.updateCreditBalance(id, updateCreditBalanceDto);
  }

  @Patch(':id/toggle-credit-sales')
  @ApiOperation({ summary: 'Enable or disable credit sales for customer' })
  @ApiBody({ type: ToggleCreditSalesDto })
  @ApiResponse({ status: 200, description: 'Credit sales setting updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async toggleCreditSales(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() toggleCreditSalesDto: ToggleCreditSalesDto
  ): Promise<CustomerResponseDto> {
    return this.customerService.toggleCreditSales(id, toggleCreditSalesDto);
  }

  @Patch(':id/suspend-credit')
  @ApiOperation({ summary: 'Suspend credit for customer' })
  @ApiResponse({ status: 200, description: 'Credit suspended successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async suspendCredit(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerResponseDto> {
    return this.customerService.suspendCredit(id);
  }

  // Credit Statistics and Reports
  @Get('credit/stats')
  @ApiOperation({ summary: 'Get credit statistics across all customers' })
  @ApiResponse({ status: 200, description: 'Credit statistics retrieved successfully', type: CreditStatsResponseDto })
  async getCreditStats(@CurrentUser() user: User): Promise<CreditStatsResponseDto> {
    return this.customerService.getCreditStats(user);
  }

  @Get('credit/eligible')
  @ApiOperation({ summary: 'Get customers eligible for credit sales' })
  @ApiResponse({ status: 200, description: 'Credit eligible customers retrieved successfully', type: [CustomerResponseDto] })
  async getCreditEligibleCustomers(): Promise<CustomerResponseDto[]> {
    return this.customerService.getCreditEligibleCustomers();
  }

  @Get('phone/:phoneNumber')
  @ApiOperation({ summary: 'Find customer by phone number' })
  @ApiResponse({ status: 200, description: 'Customer found', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByPhoneNumber(@Param('phoneNumber') phoneNumber: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerService.findByPhoneNumber(phoneNumber);
    if (!customer) {
      return null;
    }
    return this.customerService.findOne(customer.id);
  }
}
