import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { PaginationDto } from '@/common/dto';
import { UserRole } from '@/common/enums';
import { Roles } from '@/common/decorators/roles.decorator';
import { PurchaseService } from './purchase.service';
import { 
  CreatePurchaseOrderDto,
  CreatePurchaseOrderWithNewProductDto,
  PurchaseOrderResponseDto,
  PurchaseOrderQueryDto,
  PurchaseOrderApprovalDto,
  PurchaseOrderRejectionDto,
  CreateReceivingDto,
  CreatePaymentDto,
  DashboardStatsFiltersDto
} from './dto';

@ApiTags('Purchase')
@ApiBearerAuth('access-token')
@Controller('purchase')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully', type: PurchaseOrderResponseDto })
  async create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @CurrentUser('id') userId: string, @CurrentUser() user: any) {
    return this.purchaseService.createPurchaseOrder(createPurchaseOrderDto, userId, user);
  }

  @Post('orders/new-product')
  @ApiOperation({ summary: 'Create a purchase order with new products' })
  @ApiResponse({ status: 201, description: 'Purchase order with new products created successfully', type: PurchaseOrderResponseDto })
  async createWithNewProduct(
    @Body() createDto: CreatePurchaseOrderWithNewProductDto, 
    @CurrentUser('id') userId: string,
    @CurrentUser() user: any
  ) {
    return this.purchaseService.createPurchaseOrderWithNewProduct(createDto, userId, user);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all purchase orders with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Purchase orders retrieved successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async findAll(@Query() filters: PurchaseOrderQueryDto, @CurrentUser() user: any) {
    const paginationDto = {
      page: filters.page || 1,
      limit: filters.limit || 10
    };
    // Convert single enum values to arrays for service compatibility
    const serviceFilters = {
      status: filters.status ? [filters.status] : undefined,
      supplierId: filters.supplierId,
      warehouseId: filters.warehouseId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    };
    return this.purchaseService.findAll(paginationDto, serviceFilters, user);
  }

  @Get('payables')
  @ApiOperation({ summary: 'Get all payable purchase orders (credit purchases)' })
  @ApiResponse({ status: 200, description: 'Payable purchase orders retrieved successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async getPayables(@Query() filters: PurchaseOrderQueryDto, @CurrentUser() user: any) {
    const paginationDto = {
      page: filters.page || 1,
      limit: filters.limit || 10
    };
    return this.purchaseService.getPayables(paginationDto, user);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Purchase order retrieved successfully', type: PurchaseOrderResponseDto })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Patch('orders/:id/approve')
  @ApiOperation({ summary: 'Approve a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order approved successfully' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: PurchaseOrderApprovalDto
  ) {
    return this.purchaseService.approvePurchaseOrder(id, userId, body.approvalNotes);
  }

  @Patch('orders/:id/reject')
  @ApiOperation({ summary: 'Reject a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order rejected successfully' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: PurchaseOrderRejectionDto
  ) {
    return this.purchaseService.rejectPurchaseOrder(id, userId, body.rejectionReason);
  }

  @Post('receiving')
  @ApiOperation({ summary: 'Create a receiving record' })
  @ApiResponse({ status: 201, description: 'Receiving record created successfully' })
  async createReceiving(@Body() createReceivingDto: CreateReceivingDto, @CurrentUser('id') userId: string) {
    return this.purchaseService.createReceiving(createReceivingDto, userId);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Add payment for a purchase order' })
  @ApiResponse({ status: 201, description: 'Payment record created successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async addPayment(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.purchaseService.addPayment(createPaymentDto, userId);
  }

  @Patch('payments/:id/complete')
  @ApiOperation({ summary: 'Complete a payment' })
  @ApiResponse({ status: 200, description: 'Payment completed successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async completePayment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.purchaseService.completePayment(id, userId);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get purchase dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  async getDashboardStats(@Query() filters: DashboardStatsFiltersDto, @CurrentUser() user: any) {
    return this.purchaseService.getDashboardStats(filters, user);
  }

  @Get('receiving/stats')
  @ApiOperation({ summary: 'Get receiving statistics' })
  @ApiResponse({ status: 200, description: 'Receiving statistics retrieved successfully' })
  async getReceivingStats(@CurrentUser() user: any) {
    return this.purchaseService.getReceivingStats(user);
  }
}
