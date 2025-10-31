import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
  SupplierResponseDto,
} from './dto/supplier.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { SupplierStatus } from './enums/supplier-status.enum';

@ApiTags('Suppliers')
@ApiBearerAuth('access-token')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this name or email already exists in the company',
  })
  async create(@Body() createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SHOP_EMPLOYEE, UserRole.USER)
  @ApiOperation({ summary: 'Get all suppliers with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, enum: SupplierStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by company ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Show only active suppliers' })
  @ApiResponse({
    status: 200,
    description: 'List of suppliers',
    type: SupplierResponseDto,
    isArray: true,
  })
  async findAll(@Query() query: SupplierQueryDto, @CurrentUser() user: any): Promise<PaginatedResult<SupplierResponseDto>> {
    // Add company filtering for non-super-admin users
    if (user.role !== UserRole.SUPER_ADMIN) {
      query.companyId = user.company?.id || (user as any).companyId;
    }
    return this.supplierService.findAll(query);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all suppliers for a specific company' })
  @ApiParam({ name: 'companyId', type: 'string', description: 'Company ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Show only active suppliers', example: true })
  @ApiResponse({
    status: 200,
    description: 'List of company suppliers',
    type: SupplierResponseDto,
    isArray: true,
  })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('activeOnly') activeOnly: boolean = true
  ): Promise<SupplierResponseDto[]> {
    return this.supplierService.findByCompany(companyId, activeOnly);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get supplier statistics' })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by company ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total suppliers' },
        active: { type: 'number', description: 'Active suppliers' },
        inactive: { type: 'number', description: 'Inactive suppliers' },
        blacklisted: { type: 'number', description: 'Blacklisted suppliers' },
        suspended: { type: 'number', description: 'Suspended suppliers' },
        pendingApproval: { type: 'number', description: 'Suppliers pending approval' },
      }
    }
  })
  async getStats(
    @Query('companyId') companyId?: string
  ): Promise<{
    total: number;
    active: number;
    inactive: number;
    blacklisted: number;
    suspended: number;
    pendingApproval: number;
  }> {
    return this.supplierService.getSupplierStats(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier details',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this name or email already exists in the company',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto
  ): Promise<SupplierResponseDto> {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 204,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete supplier with existing purchase orders',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.supplierService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier activated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return this.supplierService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deactivated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return this.supplierService.deactivate(id);
  }

  @Patch(':id/blacklist')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Blacklist supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier blacklisted successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  async blacklist(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return this.supplierService.blacklist(id);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Suspend supplier' })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier suspended successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return this.supplierService.suspend(id);
  }
}
