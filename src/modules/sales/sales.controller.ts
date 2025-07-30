import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, SaleQueryDto, SaleResponseDto } from './dto';
import { CreatePaymentTransactionDto, PaymentTransactionResponseDto } from './dto/payment-transaction.dto';
import { PaginatedResult } from '@/common/interfaces';
import { SaleStatus } from './enums';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ status: 201, description: 'Sale created successfully', type: SaleResponseDto })
  async create(@Body() createSaleDto: CreateSaleDto): Promise<SaleResponseDto> {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus })
  @ApiResponse({ status: 200, description: 'List of sales', type: [SaleResponseDto] })
  async findAll(@Query() query: SaleQueryDto): Promise<PaginatedResult<SaleResponseDto>> {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale details', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SaleResponseDto> {
    return this.salesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale by ID' })
  @ApiBody({ type: UpdateSaleDto })
  @ApiResponse({ status: 200, description: 'Sale updated successfully', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSaleDto: UpdateSaleDto): Promise<SaleResponseDto> {
    return this.salesService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sale by ID' })
  @ApiResponse({ status: 204, description: 'Sale deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.salesService.remove(id);
  }

  @Post(':id/payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply payment to a sale' })
  @ApiBody({ type: CreatePaymentTransactionDto })
  @ApiResponse({ status: 201, description: 'Payment applied successfully', type: PaymentTransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async applyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: CreatePaymentTransactionDto
  ): Promise<PaymentTransactionResponseDto> {
    return this.salesService.applyPayment(id, paymentDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update sale status' })
  @ApiResponse({ status: 200, description: 'Sale status updated successfully', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: { status: SaleStatus; userId: string }
  ): Promise<SaleResponseDto> {
    return this.salesService.updateStatus(id, statusDto.status, statusDto.userId);
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process sale return' })
  @ApiResponse({ status: 201, description: 'Return processed successfully', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async processSaleReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() returnDto: { reason: string; userId: string }
  ): Promise<SaleResponseDto> {
    return this.salesService.processSaleReturn(id, returnDto.reason, returnDto.userId);
  }

  @Get(':id/payment-history')
  @ApiOperation({ summary: 'Get payment history for a sale' })
  @ApiResponse({ status: 200, description: 'Payment history', type: [PaymentTransactionResponseDto] })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async getPaymentHistory(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentTransactionResponseDto[]> {
    return this.salesService.getPaymentHistory(id);
  }

  @Get('reports/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Daily sales report' })
  async getDailySalesReport(@Query('date') date?: string) {
    return this.salesService.getDailySalesReport(date);
  }

  @Get('reports/monthly')
  @ApiOperation({ summary: 'Get monthly sales report' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Monthly sales report' })
  async getMonthlySalesReport(@Query('year') year?: number, @Query('month') month?: number) {
    return this.salesService.getMonthlySalesReport(year, month);
  }
}
