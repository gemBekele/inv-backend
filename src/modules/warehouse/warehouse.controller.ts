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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseQueryDto,
  WarehouseResponseDto,
  WarehouseDetailResponseDto,
  AttachProductDto,
} from './dto';
import { PaginatedResult } from '@/common/interfaces';

@ApiTags('Warehouses')
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiBody({ type: CreateWarehouseDto })
  @ApiResponse({
    status: 201,
    description: 'Warehouse created successfully',
    type: WarehouseResponseDto,
  })
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehouseService.create(createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of warehouses',
    type: [WarehouseResponseDto],
  })
  async findAll(
    @Query() query: WarehouseQueryDto,
  ): Promise<PaginatedResult<WarehouseResponseDto>> {
    return this.warehouseService.findAll(query);
  }

  @Get('with-products')
  @ApiOperation({
    summary: 'Get all warehouses with product details and pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of warehouses with products',
    type: [WarehouseDetailResponseDto],
  })
  async findAllWithProducts(
    @Query() query: WarehouseQueryDto,
  ): Promise<PaginatedResult<WarehouseDetailResponseDto>> {
    return this.warehouseService.findAllWithProducts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by ID with attached products' })
  @ApiResponse({
    status: 200,
    description: 'Warehouse details',
    type: WarehouseDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WarehouseDetailResponseDto> {
    return this.warehouseService.findOne(id);
  }
  @Get(':id/products/:productId')
  @ApiOperation({ summary: 'Get a specific product of a warehouse by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details for this warehouse',
    type: WarehouseDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Warehouse or product not found' })
  async getProductOfWarehouse(
    @Param('id', ParseUUIDPipe) warehouseId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.warehouseService.findProductOfWarehouse(warehouseId, productId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a warehouse by ID' })
  @ApiBody({ type: UpdateWarehouseDto })
  @ApiResponse({
    status: 200,
    description: 'Warehouse updated successfully',
    type: WarehouseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehouseService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a warehouse by ID' })
  @ApiResponse({ status: 204, description: 'Warehouse deleted successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.warehouseService.remove(id);
  }

  @Post(':id/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Attach a product to a warehouse' })
  @ApiBody({ type: AttachProductDto })
  @ApiResponse({ status: 201, description: 'Product attached to warehouse' })
  @ApiResponse({ status: 404, description: 'Warehouse or product not found' })
  @ApiResponse({ status: 409, description: 'Product already attached' })
  async attachProduct(
    @Param('id', ParseUUIDPipe) warehouseId: string,
    @Body() attachProductDto: AttachProductDto,
  ): Promise<void> {
    return this.warehouseService.attachProduct(warehouseId, attachProductDto);
  }

  @Delete(':id/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a product from a warehouse' })
  @ApiResponse({ status: 204, description: 'Product detached from warehouse' })
  @ApiResponse({ status: 404, description: 'Warehouse or product not found' })
  async detachProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.warehouseService.detachProduct(id, productId);
  }
}
