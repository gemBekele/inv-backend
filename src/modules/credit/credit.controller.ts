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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditService } from './credit.service';
import { CreditPdfService } from './services/credit-pdf.service';
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
@ApiBearerAuth('access-token')
@Controller('credits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly creditPdfService: CreditPdfService,
  ) {}

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
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.USER)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  @ApiOperation({ summary: 'Create payment for credit' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async createPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreateCreditPaymentDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.creditService.createPayment(id, createPaymentDto, user);
    return result;
  }

  @Get(':id/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  @ApiOperation({ summary: 'Get all payments for credit' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async findPayments(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.creditService.findPayments(id, user);
    return result;
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

  @Get(':creditId/payments/:paymentId/receipt/pdf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  @ApiOperation({ summary: 'Generate PDF receipt for a credit payment' })
  @ApiResponse({ status: 200, description: 'PDF receipt generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit or payment not found' })
  async generatePaymentReceiptPdf(
    @Param('creditId', ParseUUIDPipe) creditId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const credit = await this.creditService.findOneWithRelations(creditId, user);
    const payment = credit.payments?.find(p => p.id === paymentId);

    if (!payment) {
      res.status(404).json({ 
        success: false, 
        message: 'Payment not found',
        timestamp: new Date().toISOString() 
      });
      return;
    }

    const pdfBuffer = await this.creditPdfService.generatePaymentReceipt(credit, payment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment-receipt-${payment.paymentNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  @Get(':id/statement/pdf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  @ApiOperation({ summary: 'Generate PDF statement for a credit' })
  @ApiResponse({ status: 200, description: 'PDF statement generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async generateCreditStatementPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const credit = await this.creditService.findOneWithRelations(id, user);

    const pdfBuffer = await this.creditPdfService.generateCreditStatement(credit);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=credit-statement-${credit.creditNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }
}