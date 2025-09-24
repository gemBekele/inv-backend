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
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyQueryDto,
  CompanyResponseDto,
  AddWarehouseDto,
  AddShopDto,
  BranchesResponseDto,
} from './dto';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { User } from '@/modules/users/entities/user.entity';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: CompanyResponseDto,
  })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.create(createCompanyDto);
  }

  @Post(':id/warehouses')
  @ApiOperation({ summary: 'Associate a warehouse with a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiBody({
	type: AddWarehouseDto,
	description: 'List of warehouse IDs to associate with the company',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse associated',
    type: CompanyResponseDto,
  })
  async addWarehouses(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() addWarehousesDto: AddWarehouseDto,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.addWarehouses(companyId, addWarehousesDto.warehouseIds, user);
  }

  @Get(':id/warehouses')
  @ApiOperation({ summary: 'Get warehouses associated with a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of warehouses',
    type: [CompanyResponseDto],
  })
  async getWarehouses(
    @Param('id', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.getWarehouses(companyId, user);
  }

  @Post(':id/shops')
  @ApiOperation({ summary: 'Associate shops with a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiBody({
    type: AddShopDto,
    description: 'List of shop IDs to associate with the company',
  })
  @ApiResponse({
    status: 200,
    description: 'Shops associated',
    type: CompanyResponseDto,
  })
  async addShops(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() addShopsDto: AddShopDto,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.addShops(companyId, addShopsDto.shopIds, user);
  }

  @Get(':id/shops')
  @ApiOperation({ summary: 'Get shops associated with a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of shops',
    type: CompanyResponseDto,
  })
  async getShops(
    @Param('id', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.getShops(companyId, user);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get all branches (warehouses and shops) accessible to the user' })
  @ApiResponse({
    status: 200,
    description: 'List of branches accessible to the user',
    type: BranchesResponseDto,
  })
  async getBranches(
    @CurrentUser() user: User
  ): Promise<BranchesResponseDto> {
    return this.companyService.getBranches(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of companies',
    type: [CompanyResponseDto],
  })
  async findAll(
    @Query() query: CompanyQueryDto,
    @CurrentUser() user: User
  ): Promise<PaginatedResult<CompanyResponseDto>> {
    return this.companyService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({
    status: 200,
    description: 'Company details',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a company by ID' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: User
  ): Promise<CompanyResponseDto> {
    return this.companyService.update(id, updateCompanyDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company by ID' })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    return this.companyService.remove(id, user);
  }
}
