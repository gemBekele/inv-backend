import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { Product } from '../../products/entities/product.entity';
import { WarehouseProduct } from '../entities/warehouse-product.entity';
import { Company } from '../../company/entities/company.entity';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryDto, WarehouseResponseDto, WarehouseDetailResponseDto, AttachProductDto } from '../dto';
import { PaginatedResult } from '../../../common/interfaces';
import { ProductResponseDto } from '../../products/dto';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { UserRole } from '@/common/enums';
import { BaseMultiTenantService, MultiTenantUser } from '@/common/services/base-multi-tenant.service';

@Injectable()
export class WarehouseService extends BaseMultiTenantService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async create(createWarehouseDto: CreateWarehouseDto, user?: MultiTenantUser): Promise<WarehouseResponseDto> {
    const { companyId, managerId, ...warehouseData } = createWarehouseDto;
    
    // Set company context if user is provided
    let finalCompanyId = companyId;
    if (user) {
      const contextData = this.setCompanyContext({ companyId }, user);
      finalCompanyId = contextData.companyId;
    }
    
    // Validate that the company exists
    const company = await this.companyRepository.findOne({ where: { id: finalCompanyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Validate manager if provided
    let manager = null;
    if (managerId) {
      manager = await this.userRepository.findOne({ where: { id: managerId } });
      if (!manager) {
        throw new NotFoundException('Manager not found');
      }
    }

    const warehouse = this.warehouseRepository.create({
      ...warehouseData,
      company,
      manager,
    });
    
    const savedWarehouse = await this.warehouseRepository.save(warehouse);
    return this.mapToResponseDto(savedWarehouse);
  }

  async findAll(query: WarehouseQueryDto, user?: MultiTenantUser): Promise<PaginatedResult<WarehouseResponseDto>> {
    const { page = 1, limit = 10, search } = query;
    const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.company', 'company')
      .leftJoinAndSelect('warehouse.manager', 'manager');
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'warehouse');
    }
    
    if (search) {
      queryBuilder.andWhere('warehouse.name LIKE :search', { search: `%${search}%` });
    }
    
    const [warehouses, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return {
      data: warehouses.map(w => this.mapToResponseDto(w)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithProducts(query: WarehouseQueryDto, user?: MultiTenantUser): Promise<PaginatedResult<WarehouseDetailResponseDto>> {
    const { page = 1, limit = 10, search } = query;
    const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.products', 'products')
      .leftJoinAndSelect('products.product', 'product');
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'warehouse');
    }
    
    if (search) {
      queryBuilder.andWhere('warehouse.name LIKE :search', { search: `%${search}%` });
    }
    
    const [warehouses, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return {
      data: warehouses.map(w => this.mapToDetailResponseDto(w)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

async findProductOfWarehouse(warehouseId: string, productId: string, user?: MultiTenantUser): Promise<WarehouseDetailResponseDto> {
  const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse')
    .leftJoinAndSelect('warehouse.products', 'products')
    .leftJoinAndSelect('products.product', 'product')
    .where('warehouse.id = :warehouseId', { warehouseId });
  
  // Apply company filtering
  if (user) {
    this.applyCompanyFilter(queryBuilder, user, 'warehouse');
  }
  
  const warehouse = await queryBuilder.getOne();
  if (!warehouse) {
    throw new NotFoundException('Warehouse not found');
  }
  const filteredProducts = warehouse.products.filter(
    wp => wp.product.id === productId
  );
  if (filteredProducts.length === 0) {
    throw new NotFoundException('Product not found in this warehouse');
  }
  // Create a new warehouse object with only the filtered product
  const warehouseWithFilteredProduct = {
    ...warehouse,
    products: filteredProducts,
  };
  return this.mapToDetailResponseDto(warehouseWithFilteredProduct as Warehouse);
}

  async findOne(id: string, query?: WarehouseQueryDto, user?: MultiTenantUser): Promise<WarehouseDetailResponseDto> {
    // First, get the warehouse to ensure it exists and user has access
    const warehouseQuery = this.warehouseRepository.createQueryBuilder('warehouse')
      .where('warehouse.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(warehouseQuery, user, 'warehouse');
    }
    
    const warehouse = await warehouseQuery.getOne();
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    
    // Now get the products with search filtering
    const productsQuery = this.warehouseRepository.createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.products', 'products')
      .leftJoinAndSelect('products.product', 'product')
      .where('warehouse.id = :id', { id });
    
    // Apply company filtering again
    if (user) {
      this.applyCompanyFilter(productsQuery, user, 'warehouse');
    }
    
    // Apply product search filter if search term is provided
    if (query?.search) {
      productsQuery.andWhere(
        '(products.id IS NULL OR product.name ILIKE :search OR product.sku ILIKE :search OR product.category ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }
    
    const warehouseWithProducts = await productsQuery.getOne();
    // Use the original warehouse info but with filtered products
    return this.mapToDetailResponseDto(warehouseWithProducts || { ...warehouse, products: [] });
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto, user?: MultiTenantUser): Promise<WarehouseResponseDto> {
    const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse')
      .where('warehouse.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'warehouse');
    }
    
    const warehouse = await queryBuilder.getOne();
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    
    Object.assign(warehouse, updateWarehouseDto);
    const updatedWarehouse = await this.warehouseRepository.save(warehouse);
    return this.mapToResponseDto(updatedWarehouse);
  }

  async remove(id: string, user?: MultiTenantUser): Promise<void> {
    const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse')
      .where('warehouse.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'warehouse');
    }
    
    const warehouse = await queryBuilder.getOne();
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    
    const result = await this.warehouseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Warehouse not found');
    }
  }

  async attachProduct(warehouseId: string, attachProductDto: AttachProductDto): Promise<void> {
    const { productId } = attachProductDto;
    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const existing = await this.warehouseProductRepository.findOne({
      where: { warehouse: { id: warehouseId }, product: { id: productId } },
    });
    if (existing) {
      throw new ConflictException('Product already attached to warehouse');
    }
    const warehouseProduct = this.warehouseProductRepository.create({
      warehouse,
      product,
      stockQuantity: attachProductDto.stockQuantity,
	  minStockLevel: attachProductDto.minStockLevel, 
    });
    await this.warehouseProductRepository.save(warehouseProduct);
  }

  async detachProduct(warehouseId: string, productId: string): Promise<void> {
    const result = await this.warehouseProductRepository.delete({
      warehouse: { id: warehouseId },
      product: { id: productId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Product not found in warehouse');
    }
  }

  async updateProductStock(warehouseId: string, productId: string, stockQuantity: number): Promise<void> {
    const warehouseProduct = await this.warehouseProductRepository.findOne({
      where: { warehouse: { id: warehouseId }, product: { id: productId } },
    });
    if (!warehouseProduct) {
      throw new NotFoundException('Product not found in warehouse');
    }
    warehouseProduct.stockQuantity = stockQuantity;
    await this.warehouseProductRepository.save(warehouseProduct);
  }

  async transferProducts(warehouseId: string, shopId: string, productId: string, quantity: number, user: User) {
    if (user.role !== UserRole.COMPANY_ADMIN) throw new ForbiddenException('Only company owners can transfer products');

    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId }, relations: ['products', 'company'] });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const shop = await this.shopRepository.findOne({ where: { id: shopId }, relations: ['warehouse'] });
    if (!shop || shop.warehouse.id !== warehouseId) throw new NotFoundException('Shop not found or not associated with warehouse');

    const warehouseProduct = await this.warehouseProductRepository.findOne({ where: { id: productId, warehouse: { id: warehouseId } } });
    if (!warehouseProduct || warehouseProduct.quantity < quantity) throw new NotFoundException('Insufficient product quantity');

    // Update warehouse product quantity
    warehouseProduct.quantity -= quantity;
    await this.warehouseProductRepository.save(warehouseProduct);

    // Add to shop (assuming a ShopProduct entity or similar; adjust as needed)
    // For simplicity, we'll assume a similar entity; you may need to create ShopProduct
    const shopProduct = this.warehouseProductRepository.create({
      product: warehouseProduct.product,
      quantity,
      warehouse: shop.warehouse,
    });
    await this.warehouseProductRepository.save(shopProduct);

    return { message: 'Product transferred successfully' };
  }

  async recordSale(warehouseId: string, productId: string, quantity: number, revenue: number): Promise<void> {
    const warehouseProduct = await this.warehouseProductRepository.findOne({
      where: { warehouse: { id: warehouseId }, product: { id: productId } },
    });
    if (!warehouseProduct) {
      throw new NotFoundException('Product not found in warehouse');
    }
    if (warehouseProduct.stockQuantity < quantity) {
      throw new ConflictException('Insufficient stock');
    }
    warehouseProduct.stockQuantity -= quantity;
    warehouseProduct.salesQuantity = (warehouseProduct.salesQuantity || 0) + quantity;
    warehouseProduct.salesRevenue = (warehouseProduct.salesRevenue || 0) + revenue;
    warehouseProduct.lastSaleDate = new Date();
    await this.warehouseProductRepository.save(warehouseProduct);
  }

  private mapToResponseDto(warehouse: Warehouse): WarehouseResponseDto {
    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description,
      capacity: warehouse.capacity,
      companyName: warehouse.company?.name,
      managerName: warehouse.manager?.fullName,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }

  private mapToDetailResponseDto(warehouse: Warehouse): WarehouseDetailResponseDto {
    return {
      ...this.mapToResponseDto(warehouse),
      products: warehouse.products.map(wp => this.mapProductToResponseDto(wp.product)),
    };
  }

  private mapProductToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.type,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      barcode: product.barcode,
      metadata: product.metadata,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      cost: product.cost,
      status: product.status,
      taxRate: product.taxRate,
      trackStock: product.trackStock,
      imageUrl: product.imageUrl,
      profitMargin: product.profitMargin,
      isExpired: product.calculatedIsExpired,
      expiryDate: product.expiryDate,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
    };
  }
}