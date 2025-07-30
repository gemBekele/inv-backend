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
import { CollectionsService } from './collections.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchQueryDto,
  BranchResponseDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
  SupplierResponseDto,
  CreateProductGroupDto,
  UpdateProductGroupDto,
  ProductGroupQueryDto,
  ProductGroupResponseDto,
} from './dto';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { UserRole } from '@/common/enums';

@ApiTags('Collections')
@ApiBearerAuth('access-token')
@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // Branch Management
  @Post('branch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
    type: BranchResponseDto,
  })
  async createBranch(
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.collectionsService.createBranch(createBranchDto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get all branches with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of branches',
    type: [BranchResponseDto],
  })
  async findAllBranches(
    @Query() query: BranchQueryDto,
  ): Promise<PaginatedResult<BranchResponseDto>> {
    return this.collectionsService.findAllBranches(query);
  }

  // Supplier Management
  @Post('supplier')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    type: SupplierResponseDto,
  })
  async createSupplier(
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.collectionsService.createSupplier(createSupplierDto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of suppliers',
    type: [SupplierResponseDto],
  })
  async findAllSuppliers(
    @Query() query: SupplierQueryDto,
  ): Promise<PaginatedResult<SupplierResponseDto>> {
    return this.collectionsService.findAllSuppliers(query);
  }

  // Product Group Management
  @Post('group')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product group' })
  @ApiBody({ type: CreateProductGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Product group created successfully',
    type: ProductGroupResponseDto,
  })
  async createProductGroup(
    @Body() createProductGroupDto: CreateProductGroupDto,
  ): Promise<ProductGroupResponseDto> {
    return this.collectionsService.createProductGroup(createProductGroupDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all product groups with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of product groups',
    type: [ProductGroupResponseDto],
  })
  async findAllProductGroups(
    @Query() query: ProductGroupQueryDto,
  ): Promise<PaginatedResult<ProductGroupResponseDto>> {
    return this.collectionsService.findAllProductGroups(query);
  }
}
