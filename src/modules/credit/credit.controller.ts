import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditService } from './credit.service';
import {
  CreateCreditDto,
  UpdateCreditDto,
  CreateCreditPaymentDto,
  CreditQueryDto,
  CreditResponseDto,
  CreditPaymentResponseDto,
  CreditTransactionResponseDto,
  CreditStatsResponseDto,
} from './dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new credit' })
  @ApiResponse({ status: 201, description: 'Credit created successfully', type: CreditResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createCreditDto: CreateCreditDto,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.create(createCreditDto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Get all credits with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Credits retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: CreditQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.creditService.findAll(query, user);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get credit statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Credit stats retrieved successfully', type: CreditStatsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats(@CurrentUser() user: User): Promise<CreditStatsResponseDto> {
    return this.creditService.getStats(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Get credit by ID' })
  @ApiResponse({ status: 200, description: 'Credit retrieved successfully', type: CreditResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update credit' })
  @ApiResponse({ status: 200, description: 'Credit updated successfully', type: CreditResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCreditDto: UpdateCreditDto,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.update(id, updateCreditDto, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve pending credit' })
  @ApiResponse({ status: 200, description: 'Credit approved successfully', type: CreditResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CreditResponseDto> {
    return this.creditService.approve(id, user);
  }

  @Post(':id/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Create payment for credit' })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: CreditPaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async createPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createPaymentDto: CreateCreditPaymentDto,
    @CurrentUser() user: User,
  ): Promise<CreditPaymentResponseDto> {
    return this.creditService.createPayment(id, createPaymentDto, user);
  }

  @Get(':id/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Get all payments for credit' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully', type: [CreditPaymentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async findPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CreditPaymentResponseDto[]> {
    return this.creditService.findPayments(id, user);
  }

  @Get(':id/transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Get all transactions for credit' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully', type: [CreditTransactionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async findTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CreditTransactionResponseDto[]> {
    return this.creditService.findTransactions(id, user);
  }

  @Get('payments/:paymentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: CreditPaymentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
  ): Promise<CreditPaymentResponseDto> {
    return this.creditService.findPayment(paymentId, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete credit (soft delete)' })
  @ApiResponse({ status: 200, description: 'Credit deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Credit has payments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.creditService.remove(id, user);
    return { message: 'Credit deleted successfully' };
  }
}