import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
  BarcodeScanDto
} from './dto';
import { ProductLocationDto } from './dto/product-location.dto';
import { JwtAuthGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../../common/enums';
import { ResponseDto } from '../../common/dto';
import { PaginatedResult } from '@/common/interfaces';
import { User } from '../users/entities/user.entity';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product or service' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Product with SKU or barcode already exists'
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User
  ): Promise<ResponseDto<ProductResponseDto>> {
    const product = await this.productsService.create(createProductDto, user.id);
    return {
      success: true,
      message: 'Product created successfully',
      data: product
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully'
  })
  async findAll(@Query() query: ProductQueryDto): Promise<ResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.findAll(query);
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: result
    };
  }

  @Get('my-products')
  @ApiOperation({ summary: 'Get products created by current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User products retrieved successfully'
  })
  async getMyProducts(
    @Query() query: ProductQueryDto,
    @CurrentUser() user: User
  ): Promise<ResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.getProductsByUser(user.id, query);
    return {
      success: true,
      message: 'User products retrieved successfully',
      data: result
    };
  }

  @Get('by-location')
  @ApiOperation({ summary: 'Get products by warehouse/shop location from user context' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location products retrieved successfully'
  })
  async getProductsByLocation(
    @Query() query: ProductQueryDto,
    @CurrentUser() user: User
  ): Promise<ResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.getProductsByUserLocation(user, query);
    return {
      success: true,
      message: 'Location products retrieved successfully',
      data: result
    };
  }

  @Get('warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get products in specific warehouse' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse products retrieved successfully'
  })
  async getWarehouseProducts(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query() query: ProductQueryDto,
    @CurrentUser() user: User
  ): Promise<ResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.getWarehouseProducts(warehouseId, query, user);
    return {
      success: true,
      message: 'Warehouse products retrieved successfully',
      data: result
    };
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get products in specific shop' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shop products retrieved successfully'
  })
  async getShopProducts(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: ProductQueryDto,
    @CurrentUser() user: User
  ): Promise<ResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.getShopProducts(shopId, query, user);
    return {
      success: true,
      message: 'Shop products retrieved successfully',
      data: result
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully'
  })
  async getCategories(): Promise<ResponseDto<string[]>> {
    const categories = await this.productsService.getCategories();
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    };
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock products retrieved successfully'
  })
  async getLowStockProducts(): Promise<ResponseDto<ProductResponseDto[]>> {
    const products = await this.productsService.getLowStockProducts();
    return {
      success: true,
      message: 'Low stock products retrieved successfully',
      data: products
    };
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired products retrieved successfully'
  })
  async getExpiredProducts(): Promise<ResponseDto<ProductResponseDto[]>> {
    const products = await this.productsService.getExpiredProducts();
    return {
      success: true,
      message: 'Expired products retrieved successfully',
      data: products
    };
  }

  @Post('barcode-scan')
  @ApiOperation({ summary: 'Find product by barcode scan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found successfully',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product with barcode not found'
  })
  async scanBarcode(@Body() barcodeScanDto: BarcodeScanDto): Promise<ResponseDto<ProductResponseDto>> {
    const product = await this.productsService.findByBarcode(barcodeScanDto.barcode);
    return {
      success: true,
      message: 'Product found successfully',
      data: product
    };
  }

  @Post('bulk-import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk import products from Excel/CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk import completed'
  })
  async bulkImport(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ResponseDto<{ success: number; errors: string[] }>> {
    const result = await this.productsService.bulkImport(file);
    return {
      success: true,
      message: `Bulk import completed. ${result.success} products imported successfully`,
      data: result
    };
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Get product locations in warehouses and shops' })
  @ApiParam({ name: 'id', description: 'Product ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product locations retrieved successfully',
    type: ProductLocationDto
  })
  async getProductLocations(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDto<ProductLocationDto>> {
    const locations = await this.productsService.getProductLocations(id);
    return {
      success: true,
      message: 'Product locations retrieved successfully',
      data: locations
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDto<ProductResponseDto>> {
    const product = await this.productsService.findOne(id);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: product
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Product with SKU or barcode already exists'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ResponseDto<ProductResponseDto>> {
    const product = await this.productsService.update(id, updateProductDto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: product
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseDto<null>> {
    await this.productsService.remove(id);
    return {
      success: true,
      message: 'Product deleted successfully',
      data: null
    };
  }
}