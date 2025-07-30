import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Shop } from '../shops/entities/shops.entity';
import { CreateShopDto, UpdateShopDto, ShopQueryDto, ShopResponseDto } from './dto';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Company } from '../company/entities/company.entity';
import { PaginatedResult } from '../../common/interfaces';
import { CacheService } from '@/shared/cache/cache.service';
import { CACHE_KEYS } from '../../common/constants';

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createShopDto: CreateShopDto): Promise<ShopResponseDto> {
    const { warehouseId, companyId, name, location } = createShopDto;
    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const shop = this.shopRepository.create({ name, location, warehouse, company });
    const savedShop = await this.shopRepository.save(shop);
    await this.invalidateShopCache();
    return this.mapToResponseDto(savedShop);
  }

  async findAll(query: ShopQueryDto): Promise<PaginatedResult<ShopResponseDto>> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SHOPS_LIST, JSON.stringify(query));
    const cached = await this.cacheService.get<PaginatedResult<ShopResponseDto>>(cacheKey);
    if (cached) return cached;

    const queryBuilder = this.createQueryBuilder();
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

    await this.cacheService.set(cacheKey, result, 300000);
    return result;
  }

  async findOne(id: string): Promise<ShopResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SHOP_DETAIL, id);
    const cached = await this.cacheService.get<ShopResponseDto>(cacheKey);
    if (cached) return cached;

    const shop = await this.shopRepository.findOne({ where: { id }, relations: ['warehouse', 'company'] });
    if (!shop) throw new NotFoundException('Shop not found');
    const result = this.mapToResponseDto(shop);
    await this.cacheService.set(cacheKey, result, 600000);
    return result;
  }

  async update(id: string, updateShopDto: UpdateShopDto): Promise<ShopResponseDto> {
    const shop = await this.shopRepository.findOne({ where: { id }, relations: ['warehouse', 'company'] });
    if (!shop) throw new NotFoundException('Shop not found');
    Object.assign(shop, updateShopDto);
    const updatedShop = await this.shopRepository.save(shop);
    await this.invalidateShopCache();
    await this.cacheService.del(CACHE_KEYS.SHOPS_LIST);
    return this.mapToResponseDto(updatedShop);
  }

  async remove(id: string): Promise<void> {
    const shop = await this.shopRepository.findOne({ where: { id } });
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
      warehouseName: shop.warehouse.name,
      companyName: shop.company.name,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }

  private async invalidateShopCache(): Promise<void> {
    const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.SHOPS_LIST}*`);
    this.logger.debug(`Cleared ${deletedCount} shop cache entries`);
  }
}