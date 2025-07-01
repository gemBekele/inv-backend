import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Product } from '../products/entities/product.entity';
import { WarehouseProduct } from './entities/warehouse-product.entity';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryDto, WarehouseResponseDto, WarehouseDetailResponseDto, AttachProductDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { ProductResponseDto } from '../products/dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    const savedWarehouse = await this.warehouseRepository.save(warehouse);
    return this.mapToResponseDto(savedWarehouse);
  }

  async findAll(query: WarehouseQueryDto): Promise<PaginatedResult<WarehouseResponseDto>> {
    const { page = 1, limit = 10, search } = query;
    const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse');
    if (search) {
      queryBuilder.where('warehouse.name LIKE :search', { search: `%${search}%` });
    }
    const [warehouses, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: warehouses.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithProducts(query: WarehouseQueryDto): Promise<PaginatedResult<WarehouseDetailResponseDto>> {
	const { page = 1, limit = 10, search } = query;
	const queryBuilder = this.warehouseRepository.createQueryBuilder('warehouse').leftJoinAndSelect('warehouse.products', 'products').leftJoinAndSelect('products.product', 'product');
	if (search) {
	  queryBuilder.where('warehouse.name LIKE :search', { search: `%${search}%` });
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

async findProductOfWarehouse(warehouseId: string, productId: string): Promise<WarehouseDetailResponseDto> {
  const warehouse = await this.warehouseRepository.findOne({
    where: { id: warehouseId },
    relations: ['products', 'products.product'],
  });
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

  async findOne(id: string): Promise<WarehouseDetailResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['products', 'products.product'],
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return this.mapToDetailResponseDto(warehouse);
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    Object.assign(warehouse, updateWarehouseDto);
    const updatedWarehouse = await this.warehouseRepository.save(warehouse);
    return this.mapToResponseDto(updatedWarehouse);
  }

  async remove(id: string): Promise<void> {
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
	  isExpired: product.isExpired,
    };
  }
}