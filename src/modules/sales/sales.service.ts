import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateSaleDto, UpdateSaleDto, SaleQueryDto, SaleResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { CacheService } from '@/shared/cache/cache.service';
import { CACHE_KEYS } from '../../common/constants';
import { Sales } from './entities/sales.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { SaleItem } from './entities/sales-item.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<SaleResponseDto> {
    const { customerId, warehouseId, items, paymentType, saleDate, note } = createSaleDto;
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const sales = this.salesRepository.create({
      customer,
      warehouse,
      paymentType,
      saleDate: saleDate || new Date(),
      note,
    });

    let totalAmount = 0;
    let taxAmount = 0;

    for (const itemId of items) {
      const product = await this.productRepository.findOne({ where: { id: itemId } });
      if (!product) throw new NotFoundException(`Product ${itemId} not found`);
      const saleItem = this.saleItemRepository.create({
        sales,
        product,
        quantity: 1, // Default quantity, adjust as needed
        unitPrice: product.price,
        total: product.price,
      });
      totalAmount += product.price;
      taxAmount += (product.price * product.taxRate) / 100;
      await this.saleItemRepository.save(saleItem);
    }

    sales.totalAmount = totalAmount;
    sales.taxAmount = taxAmount;
    sales.remainingBalance = totalAmount - sales.advancePayment;

    const savedSale = await this.salesRepository.save(sales);
    await this.invalidateSaleCache();
    return this.mapToResponseDto(savedSale);
  }

  async findAll(query: SaleQueryDto): Promise<PaginatedResult<SaleResponseDto>> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SALES_LIST, JSON.stringify(query));
    const cached = await this.cacheService.get<PaginatedResult<SaleResponseDto>>(cacheKey);
    if (cached) return cached;

    const queryBuilder = this.createQueryBuilder();
    this.applyFilters(queryBuilder, query);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [sales, total] = await queryBuilder.getManyAndCount();

    const result = {
      data: sales.map(sale => this.mapToResponseDto(sale)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheService.set(cacheKey, result, 300000);
    return result;
  }

  async findOne(id: string): Promise<SaleResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SALE_DETAIL, id);
    const cached = await this.cacheService.get<SaleResponseDto>(cacheKey);
    if (cached) return cached;

    const sale = await this.salesRepository.findOne({ where: { id }, relations: ['customer', 'warehouse', 'items'] });
    if (!sale) throw new NotFoundException('Sale not found');
    const result = this.mapToResponseDto(sale);
    await this.cacheService.set(cacheKey, result, 600000);
    return result;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({ where: { id }, relations: ['customer', 'warehouse'] });
    if (!sale) throw new NotFoundException('Sale not found');
    Object.assign(sale, updateSaleDto);
    const updatedSale = await this.salesRepository.save(sale);
    await this.invalidateSaleCache();
    await this.cacheService.del(CACHE_KEYS.SALES_LIST);
    return this.mapToResponseDto(updatedSale);
  }

  async remove(id: string): Promise<void> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');
    await this.salesRepository.softDelete(id);
    await this.invalidateSaleCache();
    await this.cacheService.del(this.cacheService.generateKey(CACHE_KEYS.SALE_DETAIL, id));
  }

  private createQueryBuilder(): SelectQueryBuilder<Sales> {
    return this.salesRepository.createQueryBuilder('sales')
      .leftJoin('sales.customer', 'customer')
      .leftJoin('sales.warehouse', 'warehouse')
      .select(['sales', 'customer.name', 'warehouse.name']);
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Sales>, query: SaleQueryDto): void {
    if (query.search) {
      queryBuilder.andWhere('(customer.name ILIKE :search OR warehouse.name ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query.status) {
      queryBuilder.andWhere('sales.status = :status', { status: query.status });
    }
    queryBuilder.orderBy('sales.createdAt', 'DESC');
  }

  private mapToResponseDto(sales: Sales): SaleResponseDto {
    return {
      id: sales.id,
      totalAmount: sales.totalAmount,
      taxAmount: sales.taxAmount,
      advancePayment: sales.advancePayment,
      remainingBalance: sales.remainingBalance,
      saleDate: sales.saleDate,
      paymentType: sales.paymentType,
      status: sales.status,
      note: sales.note,
      customerName: sales.customer.name,
      warehouseName: sales.warehouse.name,
      createdAt: sales.createdAt,
      updatedAt: sales.updatedAt,
    };
  }

  private async invalidateSaleCache(): Promise<void> {
    const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.SALES_LIST}*`);
    this.logger.debug(`Cleared ${deletedCount} sale cache entries`);
  }
}