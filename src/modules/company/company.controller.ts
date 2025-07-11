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
} from './dto';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard } from '@/common/guards';

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
	  @Body() addWarehousesDto: AddWarehouseDto
  ): Promise<CompanyResponseDto> {
    return this.companyService.addWarehouses(companyId, addWarehousesDto.warehouseIds);
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
  ): Promise<CompanyResponseDto> {
    return this.companyService.getWarehouses(companyId);
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
  ): Promise<PaginatedResult<CompanyResponseDto>> {
    return this.companyService.findAll(query);
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
  ): Promise<CompanyResponseDto> {
    return this.companyService.findOne(id);
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
  ): Promise<CompanyResponseDto> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company by ID' })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.companyService.remove(id);
  }
}
