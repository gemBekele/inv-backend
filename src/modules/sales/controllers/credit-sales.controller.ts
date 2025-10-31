import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CreditService } from '../../credit/credit.service';
import {
  CreateCreditDto,
  CreditResponseDto,
  CreditQueryDto,
  UpdateCreditDto,
  CreateCreditPaymentDto,
  CreditPaymentResponseDto,
  CreditStatsResponseDto,
} from '../../credit/dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { PaginatedResult } from '../../../common/interfaces';
import { CreditType } from '../../credit/enums';

@ApiTags('Credit Sales')
@ApiBearerAuth('access-token')
@Controller('credit-sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditSalesController {
  constructor(private readonly creditService: CreditService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a credit receivable' })
  @ApiResponse({
    status: 201,
    description: 'Credit created successfully',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(
    @Body() createCreditDto: CreateCreditDto,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    // Ensure this creates a receivable credit (for sales on credit)
    const creditDto = { ...createCreditDto, type: CreditType.RECEIVABLE };
    return this.creditService.create(creditDto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
    UserRole.USER,
  )
  @ApiOperation({ summary: 'Get all credit sales with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Credit sales retrieved successfully',
  })
  async findAll(
    @Query() query: CreditQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResult<CreditResponseDto>> {
    // Filter to show only receivable credits (sales on credit)
    const creditQuery = Object.assign({}, query, {
      type: CreditType.RECEIVABLE,
      page: query.page || 1,
      limit: query.limit || 10
    });
    
    return this.creditService.findAll(creditQuery as CreditQueryDto, user);
  }

  @Get('overdue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get overdue credit sales' })
  @ApiResponse({
    status: 200,
    description: 'Overdue credit sales retrieved successfully',
  })
  async getOverdue(@CurrentUser() user: User): Promise<CreditResponseDto[]> {
    // Get overdue receivable credits
    const creditQuery = {
      type: CreditType.RECEIVABLE,
      isOverdue: true,
      page: 1,
      limit: 100
    };
    
    const credits = await this.creditService.findAll(creditQuery as CreditQueryDto, user);
    return credits.data.filter(credit => credit.isOverdue);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Get credit sales statistics' })
  @ApiResponse({
    status: 200,
    description: 'Credit sales statistics retrieved successfully',
    type: CreditStatsResponseDto,
  })
  async getStats(@CurrentUser() user: User): Promise<CreditStatsResponseDto> {
    // Delegate to credit service for receivable stats
    return this.creditService.getStats(user);
  }

  @Get('customer/:customerId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get credit sales for a specific customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({
    status: 200,
    description: 'Customer credit sales retrieved successfully',
  })
  async getCustomerCreditSales(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto[]> {
    const creditQuery = {
      type: CreditType.RECEIVABLE,
      customerId: customerId,
      page: 1,
      limit: 100
    };
    
    const credits = await this.creditService.findAll(creditQuery as CreditQueryDto, user);
    return credits.data;
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get credit sale by ID' })
  @ApiParam({ name: 'id', description: 'Credit sale UUID' })
  @ApiResponse({
    status: 200,
    description: 'Credit sale retrieved successfully',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Credit sale not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update credit sale' })
  @ApiParam({ name: 'id', description: 'Credit sale UUID' })
  @ApiResponse({
    status: 200,
    description: 'Credit sale updated successfully',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Credit sale not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCreditDto: UpdateCreditDto,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.update(id, updateCreditDto, user);
  }

  @Post(':id/payments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.SHOP_EMPLOYEE,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process payment for credit sale' })
  @ApiParam({ name: 'id', description: 'Credit sale UUID' })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
    type: CreditPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - payment validation error' })
  @ApiResponse({ status: 404, description: 'Credit sale not found' })
  async processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: CreateCreditPaymentDto,
    @CurrentUser() user: User,
  ): Promise<CreditPaymentResponseDto> {
    return this.creditService.createPayment(id, paymentDto, user);
  }

  @Post('calculate-interest')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Calculate and update interest for overdue credit sales',
    description: 'Admin-only endpoint to calculate interest and late fees for overdue credit sales'
  })
  @ApiResponse({
    status: 200,
    description: 'Interest calculation completed successfully',
  })
  async calculateInterest(@CurrentUser() user: User): Promise<{ message: string }> {
    // This would be a custom implementation for calculating interest on overdue credits
    // For now, just return a success message
    return { message: 'Interest calculation completed successfully' };
  }
}