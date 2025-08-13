import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, Between } from 'typeorm';
import * as XLSX from 'xlsx';
import { Product } from './entities/product.entity';
import { WarehouseProduct } from '../warehouse/entities/warehouse-product.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  ProductQueryDto,
  ProductResponseDto
} from './dto';
import { ProductLocationDto } from './dto/product-location.dto';
import { ProductType, ProductStatus } from './enums';
import { PaginatedResult } from '../../common/interfaces';
import { CACHE_KEYS } from '../../common/constants';
import { CacheService } from '@/shared/cache/cache.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
    @InjectRepository(ShopProduct)
    private readonly shopProductRepository: Repository<ShopProduct>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Check for duplicate SKU
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: createProductDto.sku }
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Check for duplicate barcode
    if (createProductDto.barcode) {
      const existingProduct = await this.productRepository.findOne({
        where: { barcode: createProductDto.barcode }
      });
      if (existingProduct) {
        throw new ConflictException('Product with this barcode already exists');
      }
    }

    // Services don't track stock
    if (createProductDto.type === ProductType.SERVICE) {
      createProductDto.trackStock = false;
      createProductDto.stockQuantity = 0;
      createProductDto.minStockLevel = 0;
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    // Clear cache
    await this.invalidateProductCache();

    return this.mapToResponseDto(savedProduct);
  }

  /**
   * Get all products with filtering and pagination
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedResult<ProductResponseDto>> {
    const cacheKey = this.cacheService.generateKey(
      CACHE_KEYS.PRODUCTS_LIST,
      JSON.stringify(query)
    );
    
    // Try to get from cache with error handling
    try {
      const cached = await this.cacheService.get<PaginatedResult<ProductResponseDto>>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for products list`);
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache get failed, proceeding with database query:', error.message);
    }

    const queryBuilder = this.createQueryBuilder();
    
    // Apply filters
    this.applyFilters(queryBuilder, query);

    // Apply pagination
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [products, total] = await queryBuilder.getManyAndCount();

    const result: PaginatedResult<ProductResponseDto> = {
      data: products.map(product => this.mapToResponseDto(product)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    // Cache the result with error handling
    try {
      await this.cacheService.set(cacheKey, result, 300000);
    } catch (error) {
      this.logger.warn('Cache set failed:', error.message);
    }

    return result;
  }

  /**
   * Get product by ID
   */
  async findOne(id: string): Promise<ProductResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.PRODUCT_DETAIL, id);
    
    // Try to get from cache
    const cached = await this.cacheService.get<ProductResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for product: ${id}`);
      return cached;
    }

    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const result = this.mapToResponseDto(product);

    // Cache the result for 10 minutes
    await this.cacheService.set(cacheKey, result, 600000);

    return result;
  }

  /**
   * Update product
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check for duplicate SKU (if updating)
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku }
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Check for duplicate barcode (if updating)
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingProduct = await this.productRepository.findOne({
        where: { barcode: updateProductDto.barcode }
      });
      if (existingProduct) {
        throw new ConflictException('Product with this barcode already exists');
      }
    }

    // Services don't track stock
    if (updateProductDto.type === ProductType.SERVICE) {
      updateProductDto.trackStock = false;
      updateProductDto.stockQuantity = 0;
      updateProductDto.minStockLevel = 0;
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    // Invalidate caches
    await this.invalidateProductCache();
    await this.cacheService.del(
      this.cacheService.generateKey(CACHE_KEYS.PRODUCT_DETAIL, id)
    );

    return this.mapToResponseDto(updatedProduct);
  }

  /**
   * Delete product (soft delete)
   */
  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.softDelete(id);

    // Invalidate caches
    await this.invalidateProductCache();
    await this.cacheService.del(
      this.cacheService.generateKey(CACHE_KEYS.PRODUCT_DETAIL, id)
    );
  }

  /**
   * Find product by barcode
   */
  async findByBarcode(barcode: string): Promise<ProductResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.PRODUCT_DETAIL, 'barcode', barcode);
    
    // Try cache first
    const cached = await this.cacheService.get<ProductResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({ 
      where: { barcode } 
    });
    
    if (!product) {
      throw new NotFoundException('Product with this barcode not found');
    }

    const result = this.mapToResponseDto(product);
    
    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, result, 600000);

    return result;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<ProductResponseDto[]> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.PRODUCTS_LIST, 'low-stock');
    
    const cached = await this.cacheService.get<ProductResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.trackStock = :trackStock', { trackStock: true })
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.status = :status', { status: ProductStatus.AVAILABLE })
      .getMany();

    const result = products.map(product => this.mapToResponseDto(product));
    
    // Cache for 2 minutes (short TTL for stock data)
    await this.cacheService.set(cacheKey, result, 120000);

    return result;
  }

  /**
   * Get expired products
   */
  async getExpiredProducts(): Promise<ProductResponseDto[]> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.PRODUCTS_LIST, 'expired');
    
    const cached = await this.cacheService.get<ProductResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.expiryDate < :now', { now: new Date() })
      .andWhere('product.status = :status', { status: ProductStatus.AVAILABLE })
      .getMany();

    const result = products.map(product => this.mapToResponseDto(product));
    
    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300000);

    return result;
  }

  /**
   * Bulk import products from Excel/CSV
   */
  async bulkImport(file: Express.Multer.File): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const [index, row] of data.entries()) {
        try {
          const productData = this.validateImportRow(row as any, index + 2);
          await this.create(productData);
          success++;
        } catch (error) {
          errors.push(`Row ${index + 2}: ${error.message}`);
        }
      }

      // Clear cache after bulk import
      await this.invalidateProductCache();

      return { success, errors };
    } catch (error) {
      throw new BadRequestException('Invalid file format');
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.PRODUCTS_LIST, 'categories');
    
    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.AVAILABLE })
      .getRawMany();

    const categories = result.map(item => item.category).filter(Boolean);
    
    // Cache for 30 minutes
    await this.cacheService.set(cacheKey, categories, 1800000);

    return categories;
  }

  /**
   * Get product locations in warehouses and shops
   */
  async getProductLocations(productId: string): Promise<ProductLocationDto> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [warehouseProducts, shopProducts] = await Promise.all([
      this.warehouseProductRepository.find({
        where: { product: { id: productId } },
        relations: ['warehouse']
      }),
      this.shopProductRepository.find({
        where: { product: { id: productId } },
        relations: ['shop']
      })
    ]);

    return {
      warehouses: warehouseProducts.map(wp => ({
        id: wp.warehouse.id,
        name: wp.warehouse.name,
        location: wp.warehouse.location || '',
        stockQuantity: wp.stockQuantity,
        minStockLevel: wp.minStockLevel
      })),
      shops: shopProducts.map(sp => ({
        id: sp.shop.id,
        name: sp.shop.name,
        location: sp.shop.location || '',
        stockQuantity: sp.stockQuantity,
        minStockLevel: sp.minStockLevel
      }))
    };
  }

  /**
   * Private helper methods
   */
  private createQueryBuilder(): SelectQueryBuilder<Product> {
    return this.productRepository.createQueryBuilder('product');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>, 
    query: ProductQueryDto
  ): void {
    // Search filter
    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Type filter
    if (query.type) {
      queryBuilder.andWhere('product.type = :type', { type: query.type });
    }

    // Category filter
    if (query.category) {
      queryBuilder.andWhere('product.category = :category', { category: query.category });
    }

    // Status filter
    if (query.status) {
      queryBuilder.andWhere('product.status = :status', { status: query.status });
    }

    // Price range filter
    if (query.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Low stock filter
    if (query.lowStock) {
      queryBuilder.andWhere('product.trackStock = :trackStock', { trackStock: true });
      queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel');
    }

    // Expired filter
    if (query.expired) {
      queryBuilder.andWhere('product.expiryDate < :now', { now: new Date() });
    }

    // Default ordering
    queryBuilder.orderBy('product.createdAt', 'DESC');
  }

  private validateImportRow(row: any, rowNumber: number): CreateProductDto {
    const requiredFields = ['name', 'category', 'unit', 'price', 'type'];
    
    for (const field of requiredFields) {
      if (!row[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate type
    if (!Object.values(ProductType).includes(row.type)) {
      throw new Error(`Invalid product type: ${row.type}`);
    }

    return {
      type: row.type,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      category: row.category,
      unit: row.unit,
      price: parseFloat(row.price),
      cost: row.cost ? parseFloat(row.cost) : 0,
      stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity) : 0,
      minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : 0,
      expiryDate: row.expiryDate,
      status: row.status || ProductStatus.AVAILABLE,
      imageUrl: row.imageUrl,
      taxRate: row.taxRate ? parseFloat(row.taxRate) : 0,
      trackStock: row.trackStock !== undefined ? row.trackStock : true,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      type: product.type,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      unit: product.unit,
      price: product.price,
      cost: product.cost,
      expiryDate: product.expiryDate,
      status: product.status,
      metadata: product.metadata,
      imageUrl: product.imageUrl,
      taxRate: product.taxRate,
      trackStock: product.trackStock,
      profitMargin: product.profitMargin,
      isExpired: product.isExpired,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  private async invalidateProductCache(): Promise<void> {
    try {
      // Clear all product list caches
      const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}*`);
      this.logger.debug(`Cleared ${deletedCount} product cache entries`);
    } catch (error) {
      this.logger.warn('Failed to invalidate product cache:', error);
    }
  }
}