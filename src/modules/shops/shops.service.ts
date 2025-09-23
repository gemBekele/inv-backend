import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Shop } from '../shops/entities/shops.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';
import { Product } from '../products/entities/product.entity';
import { CreateShopDto, UpdateShopDto, ShopQueryDto, ShopResponseDto } from './dto';
import { AttachProductDto } from './dto/attach-product.dto';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Company } from '../company/entities/company.entity';
import { PaginatedResult } from '../../common/interfaces';
import { CacheService } from '@/shared/cache/cache.service';
import { CACHE_KEYS } from '../../common/constants';
import { BaseMultiTenantService, MultiTenantUser } from '@/common/services/base-multi-tenant.service';

@Injectable()
export class ShopsService extends BaseMultiTenantService {
  private readonly logger = new Logger(ShopsService.name);

  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(ShopProduct)
    private readonly shopProductRepository: Repository<ShopProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async create(createShopDto: CreateShopDto, user?: MultiTenantUser): Promise<ShopResponseDto> {
    const { warehouseId, companyId, name, location } = createShopDto;
    
    // Set company context if user is provided
    let finalCompanyId = companyId;
    if (user) {
      const contextData = this.setCompanyContext({ companyId }, user);
      finalCompanyId = contextData.companyId;
    }
    
    let warehouse = null;
    if (warehouseId) {
      warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
    }
    const company = await this.companyRepository.findOne({ where: { id: finalCompanyId } });
    if (!company) throw new NotFoundException('Company not found');

    const shop = this.shopRepository.create({ name, location, warehouse, company });
    const savedShop = await this.shopRepository.save(shop);
    await this.invalidateShopCache();
    return this.mapToResponseDto(savedShop);
  }

  async findAll(query: ShopQueryDto, user?: MultiTenantUser): Promise<PaginatedResult<ShopResponseDto>> {
    const queryBuilder = this.createQueryBuilder();
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'shop');
    }
    
    this.applyFilters(queryBuilder, query);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [shops, total] = await queryBuilder.getManyAndCount();

    const result = {
      data: shops.map(shop => this.mapToResponseDto(shop)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return result;
  }

  async findOne(id: string, user?: MultiTenantUser): Promise<ShopResponseDto> {
    const queryBuilder = this.shopRepository.createQueryBuilder('shop')
      .leftJoinAndSelect('shop.warehouse', 'warehouse')
      .leftJoinAndSelect('shop.company', 'company')
      .where('shop.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'shop');
    }
    
    const shop = await queryBuilder.getOne();
    if (!shop) throw new NotFoundException('Shop not found');
    return this.mapToResponseDto(shop);
  }

  async update(id: string, updateShopDto: UpdateShopDto, user?: MultiTenantUser): Promise<ShopResponseDto> {
    const queryBuilder = this.shopRepository.createQueryBuilder('shop')
      .leftJoinAndSelect('shop.warehouse', 'warehouse')
      .leftJoinAndSelect('shop.company', 'company')
      .where('shop.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'shop');
    }
    
    const shop = await queryBuilder.getOne();
    if (!shop) throw new NotFoundException('Shop not found');
    Object.assign(shop, updateShopDto);
    const updatedShop = await this.shopRepository.save(shop);
    await this.invalidateShopCache();
    await this.cacheService.del(CACHE_KEYS.SHOPS_LIST);
    return this.mapToResponseDto(updatedShop);
  }

  async remove(id: string, user?: MultiTenantUser): Promise<void> {
    const queryBuilder = this.shopRepository.createQueryBuilder('shop')
      .where('shop.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilter(queryBuilder, user, 'shop');
    }
    
    const shop = await queryBuilder.getOne();
    if (!shop) throw new NotFoundException('Shop not found');
    await this.shopRepository.softDelete(id);
    await this.invalidateShopCache();
    await this.cacheService.del(this.cacheService.generateKey(CACHE_KEYS.SHOP_DETAIL, id));
  }

  private createQueryBuilder(): SelectQueryBuilder<Shop> {
    return this.shopRepository.createQueryBuilder('shop')
      .leftJoin('shop.warehouse', 'warehouse')
      .leftJoin('shop.company', 'company')
      .select(['shop', 'warehouse.name', 'company.name']);
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Shop>, query: ShopQueryDto): void {
    if (query.search) {
      queryBuilder.andWhere('shop.name ILIKE :search OR warehouse.name ILIKE :search', { search: `%${query.search}%` });
    }
    queryBuilder.orderBy('shop.createdAt', 'DESC');
  }

  private mapToResponseDto(shop: Shop): ShopResponseDto {
    return {
      id: shop.id,
      name: shop.name,
      location: shop.location,
      warehouseName: shop.warehouse?.name || null,
      companyName: shop.company.name,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }

  async attachProduct(shopId: string, attachProductDto: AttachProductDto): Promise<void> {
    const { productId } = attachProductDto;
    const shop = await this.shopRepository.findOne({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const existing = await this.shopProductRepository.findOne({
      where: { shop: { id: shopId }, product: { id: productId } },
    });
    if (existing) {
      throw new ConflictException('Product already attached to shop');
    }
    const shopProduct = this.shopProductRepository.create({
      shop,
      product,
      stockQuantity: attachProductDto.stockQuantity,
      minStockLevel: attachProductDto.minStockLevel,
    });
    await this.shopProductRepository.save(shopProduct);
  }

  async detachProduct(shopId: string, productId: string): Promise<void> {
    const result = await this.shopProductRepository.delete({
      shop: { id: shopId },
      product: { id: productId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Product not found in shop');
    }
  }

  private async invalidateShopCache(): Promise<void> {
    const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.SHOPS_LIST}*`);
    this.logger.debug(`Cleared ${deletedCount} shop cache entries`);
  }
}