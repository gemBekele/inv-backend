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
import { BranchService } from './branch.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  BranchQueryDto,
  BranchResponseDto,
} from './dto/branch.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Branch with this name already exists in the company',
  })
  async create(@Body() createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by company ID' })
  @ApiResponse({
    status: 200,
    description: 'List of branches',
    type: BranchResponseDto,
    isArray: true,
  })
  async findAll(@Query() query: BranchQueryDto): Promise<PaginatedResult<BranchResponseDto>> {
    return this.branchService.findAll(query);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all active branches for a specific company' })
  @ApiParam({ name: 'companyId', type: 'string', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'List of company branches',
    type: BranchResponseDto,
    isArray: true,
  })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string
  ): Promise<BranchResponseDto[]> {
    return this.branchService.findByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch details',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BranchResponseDto> {
    return this.branchService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update branch' })
  @ApiParam({ name: 'id', type: 'string', description: 'Branch ID' })
  @ApiBody({ type: UpdateBranchDto })
  @ApiResponse({
    status: 200,
    description: 'Branch updated successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Branch with this name already exists in the company',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto
  ): Promise<BranchResponseDto> {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete branch' })
  @ApiParam({ name: 'id', type: 'string', description: 'Branch ID' })
  @ApiResponse({
    status: 204,
    description: 'Branch deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete branch with existing sales records',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.branchService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate branch' })
  @ApiParam({ name: 'id', type: 'string', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch activated successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<BranchResponseDto> {
    return this.branchService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate branch' })
  @ApiParam({ name: 'id', type: 'string', description: 'Branch ID' })
  @ApiResponse({
    status: 200,
    description: 'Branch deactivated successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found',
  })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<BranchResponseDto> {
    return this.branchService.deactivate(id);
  }
}
