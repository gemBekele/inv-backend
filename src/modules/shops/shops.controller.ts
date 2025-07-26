import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto, UpdateShopDto, ShopQueryDto, ShopResponseDto } from './dto';
import { PaginatedResult } from '@/common/interfaces';

@ApiTags('shops')
@Controller('shops')
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
}