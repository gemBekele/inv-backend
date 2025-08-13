import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto, UpdateShopDto, ShopQueryDto, ShopResponseDto } from './dto';
import { AttachProductDto } from './dto/attach-product.dto';
import { PaginatedResult } from '@/common/interfaces';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { UserRole } from '@/common/enums';

@ApiTags('Shops')
@ApiBearerAuth('access-token')
@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shopService: ShopsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new shop' })
  @ApiBody({ type: CreateShopDto })
  @ApiResponse({ status: 201, description: 'Shop created successfully', type: ShopResponseDto })
  async create(@Body() createShopDto: CreateShopDto): Promise<ShopResponseDto> {
    return this.shopService.create(createShopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shops with filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of shops', type: [ShopResponseDto] })
  async findAll(@Query() query: ShopQueryDto): Promise<PaginatedResult<ShopResponseDto>> {
    return this.shopService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shop by ID' })
  @ApiResponse({ status: 200, description: 'Shop details', type: ShopResponseDto })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ShopResponseDto> {
    return this.shopService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a shop by ID' })
  @ApiBody({ type: UpdateShopDto })
  @ApiResponse({ status: 200, description: 'Shop updated successfully', type: ShopResponseDto })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateShopDto: UpdateShopDto): Promise<ShopResponseDto> {
    return this.shopService.update(id, updateShopDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shop by ID' })
  @ApiResponse({ status: 204, description: 'Shop deleted successfully' })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.shopService.remove(id);
  }

  @Post(':id/products')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Attach a product to a shop' })
  @ApiBody({ type: AttachProductDto })
  @ApiResponse({ status: 201, description: 'Product attached to shop' })
  @ApiResponse({ status: 404, description: 'Shop or product not found' })
  @ApiResponse({ status: 409, description: 'Product already attached' })
  async attachProduct(
    @Param('id', ParseUUIDPipe) shopId: string,
    @Body() attachProductDto: AttachProductDto,
  ): Promise<void> {
    return this.shopService.attachProduct(shopId, attachProductDto);
  }

  @Delete(':id/products/:productId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a product from a shop' })
  @ApiResponse({ status: 204, description: 'Product detached from shop' })
  @ApiResponse({ status: 404, description: 'Shop or product not found' })
  async detachProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.shopService.detachProduct(id, productId);
  }
}