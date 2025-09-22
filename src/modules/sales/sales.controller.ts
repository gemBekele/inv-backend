import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, SaleQueryDto, SaleResponseDto, EmployeeCreateSaleDto, EmployeeCreateSaleResponseDto } from './dto';
import { QuickSaleDto } from './dto/quick-sale.dto';
import { CreatePaymentTransactionDto, PaymentTransactionResponseDto } from './dto/payment-transaction.dto';
import { 
  UpdateSaleStatusDto, 
  ProcessSaleReturnDto, 
  GetInventoryLevelsQueryDto,
  FindCustomerByPhoneQueryDto
} from './dto/sales-actions.dto';
import { PaginatedResult } from '@/common/interfaces';
import { SaleStatus } from './enums';
import { JwtAuthGuard, EmployeeGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Sales')
@ApiBearerAuth('access-token')
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ status: 201, description: 'Sale created successfully', type: SaleResponseDto })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser() currentUser: any
  ): Promise<SaleResponseDto> {
    // Auto-set createdBy from current user
    createSaleDto.createdBy = currentUser.id;
    
    // Auto-set warehouse/shop from JWT if not provided
    if (!createSaleDto.warehouseId && currentUser.warehouseId) {
      createSaleDto.warehouseId = currentUser.warehouseId;
    }
    if (!createSaleDto.shopId && currentUser.shopId) {
      createSaleDto.shopId = currentUser.shopId;
    }
    
    return this.salesService.create(createSaleDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus })
  @ApiResponse({ status: 200, description: 'List of sales', type: [SaleResponseDto] })
  async findAll(
    @Query() query: SaleQueryDto,
    @CurrentUser() user: User
  ): Promise<PaginatedResult<SaleResponseDto>> {
    return this.salesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale details', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<SaleResponseDto> {
    return this.salesService.findOne(id, user);
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
    @Body() paymentDto: CreatePaymentTransactionDto,
    @CurrentUser() currentUser: User
  ): Promise<PaymentTransactionResponseDto> {
    return this.salesService.applyPayment(id, paymentDto, currentUser);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update sale status' })
  @ApiResponse({ status: 200, description: 'Sale status updated successfully', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateSaleStatusDto
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
    @Body() returnDto: ProcessSaleReturnDto
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



  @Get('search/customer-by-phone')
  @ApiOperation({ summary: 'Find customer by phone number for sales' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findCustomerByPhone(@Query() query: FindCustomerByPhoneQueryDto) {
    return this.salesService.findCustomerByPhone(query.phone);
  }

  @Get('user-info')
  @ApiOperation({ summary: 'Get current user warehouse/shop info from token' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async getUserInfo(@CurrentUser() user: User) {
    return this.salesService.getUserInfo(user.id);
  }

  @Get('inventory/:productId/:locationId')
  @ApiOperation({ summary: 'Get real-time inventory levels for a product at specific location' })
  @ApiResponse({ status: 200, description: 'Inventory levels retrieved' })
  async getInventoryLevels(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query() query: GetInventoryLevelsQueryDto
  ) {
    return this.salesService.getInventoryLevels(productId, locationId, query.type);
  }

  @Post('employee/create-sale')
  @UseGuards(JwtAuthGuard, EmployeeGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Employee creates a new sale',
    description: 'Allows authenticated employees to create sales using their assigned warehouse/shop and automatically calculate commissions'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Sale created successfully by employee',
    type: EmployeeCreateSaleResponseDto
  })
  @ApiResponse({ status: 401, description: 'Employee authentication required' })
  @ApiResponse({ status: 403, description: 'Employee access required' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors or missing warehouse assignment' })
  @ApiResponse({ status: 404, description: 'Customer not found with provided phone number' })
  async employeeCreateSale(
    @Body() employeeCreateSaleDto: EmployeeCreateSaleDto,
    @CurrentUser() currentUser: any
  ): Promise<EmployeeCreateSaleResponseDto> {
    // 1. Find customer by phone number
    const customer = await this.salesService.findCustomerByPhone(employeeCreateSaleDto.customerPhone);
    
    // 2. Get detailed employee info first to check warehouse assignment
    const userInfo = await this.salesService.getUserInfo(currentUser.id);
    
    if (!userInfo.employee) {
      throw new BadRequestException('User is not registered as an employee');
    }
    
    // 3. Get warehouse/shop from getUserInfo which now includes fallback logic
    const employeeId = userInfo.employee.id;
    const warehouseId = userInfo.warehouse?.id || userInfo.employee.warehouse?.id || currentUser.warehouseId;
    const shopId = userInfo.shop?.id || userInfo.employee.shop?.id || currentUser.shopId;
    
    if (!warehouseId) {
      throw new BadRequestException('Employee must be assigned to a warehouse to create sales');
    }
    
    // 4. Create the sale with employee context
    const createSaleDto: CreateSaleDto = {
      customerId: customer.id,
      warehouseId: warehouseId,
      shopId: shopId,
      items: employeeCreateSaleDto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      paymentType: employeeCreateSaleDto.paymentType,
      note: `${employeeCreateSaleDto.note || ''} [Created by Employee: ${userInfo.user.name}]`,
      createdBy: currentUser.id,
      saleDate: new Date()
    };
    
    const sale = await this.salesService.create(createSaleDto, currentUser);
    
    // 5. Get commission information that was auto-calculated
    const commissionInfo = await this.salesService.getEmployeeSaleCommissions(sale.id, employeeId);
    
    return {
      success: true,
      message: 'Sale created successfully by employee with auto-calculated commissions',
      data: {
        sale,
        customer,
        employee: userInfo.employee,
        commissions: commissionInfo,
        warehouse: userInfo.warehouse,
        shop: userInfo.shop,
        employeeContext: {
          userId: currentUser.id,
          employeeId: currentUser.employeeId,
          warehouseId: currentUser.warehouseId,
          shopId: currentUser.shopId,
          companyId: currentUser.companyId,
          role: currentUser.role,
          permissions: {
            canCreateSales: true,
            canViewCommissions: true,
            canProcessPayments: true
          }
        }
      }
    };
  }

  @Post('quick-sale')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a sale using phone number lookup and JWT token info' })
  @ApiBody({ type: QuickSaleDto })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  async createQuickSale(
    @Body() saleData: QuickSaleDto,
    @CurrentUser() currentUser: any
  ) {
    // 1. Find customer by phone number
    const customer = await this.salesService.findCustomerByPhone(saleData.customerPhone);
    
    // 2. Get warehouse/shop from JWT token
    const warehouseId = currentUser.warehouseId;
    const shopId = currentUser.shopId;
    const employeeId = currentUser.employeeId;
    
    if (!warehouseId) {
      throw new BadRequestException('User must be assigned to a warehouse to create sales');
    }
    
    // 3. Get employee info from JWT token
    const userInfo = await this.salesService.getUserInfo(currentUser.id);
    
    // 4. Create the sale with all gathered information
    const createSaleDto: CreateSaleDto = {
      customerId: customer.id,
      warehouseId: warehouseId,
      shopId: shopId,
      items: saleData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      paymentType: saleData.paymentType as any,
      note: saleData.note,
      createdBy: currentUser.id,
      saleDate: new Date()
    };
    
    const sale = await this.salesService.create(createSaleDto, currentUser);
    
    return {
      success: true,
      message: 'Sale created successfully using JWT token info',
      data: {
        sale,
        customer,
        employee: userInfo.employee,
        warehouse: userInfo.warehouse,
        shop: userInfo.shop,
        tokenInfo: {
          userId: currentUser.id,
          warehouseId: currentUser.warehouseId,
          shopId: currentUser.shopId,
          employeeId: currentUser.employeeId,
          companyId: currentUser.companyId
        }
      }
    };
  }
}
