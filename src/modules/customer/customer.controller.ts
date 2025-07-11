import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, CustomerResponseDto } from './dto';
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
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of customers', type: [CustomerResponseDto] })
  async findAll(@Query() query: CustomerQueryDto): Promise<PaginatedResult<CustomerResponseDto>> {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer details', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerResponseDto> {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer by ID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a customer by ID' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customerService.remove(id);
  }

//   @Post(':id/loyalty-points')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Add loyalty points to a customer' })
//   @ApiBody({ type: AddLoyaltyPointsDto })
//   @ApiResponse({ status: 200, description: 'Loyalty points added successfully', type: CustomerResponseDto })
//   @ApiResponse({ status: 404, description: 'Customer not found' })
//   async addLoyaltyPoints(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddLoyaltyPointsDto): Promise<CustomerResponseDto> {
//     return this.customerService.addLoyaltyPoints(id, dto.points);
//   }
}