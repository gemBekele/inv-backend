import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { CreateSaleDto, UpdateSaleDto, SaleQueryDto, SaleResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { CacheService } from '@/shared/cache/cache.service';
import { CACHE_KEYS } from '../../common/constants';
import { Sales } from './entities/sales.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Shop } from '../shops/entities/shops.entity';
import { User } from '../users/entities/user.entity';
import { SaleItem } from './entities/sales-item.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Discount } from './entities/discount.entity';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { PaymentType, SaleStatus, TransactionType, DiscountType } from './enums';
import { CommissionService } from '../commission/commission.service';
import { Employee } from '../users/entities/employee.entity';
import { CreatePaymentTransactionDto, PaymentTransactionResponseDto } from './dto/payment-transaction.dto';
import { WarehouseProduct } from '../warehouse/entities/warehouse-product.entity';
import { ShopProduct } from '../shops/entities/shop-product.entity';

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
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepository: Repository<WarehouseProduct>,
    @InjectRepository(ShopProduct)
    private readonly shopProductRepository: Repository<ShopProduct>,
    private readonly cacheService: CacheService,
    private readonly commissionService: CommissionService,
  ) {}

  async create(createSaleDto: CreateSaleDto, currentUser?: any): Promise<SaleResponseDto> {
    const { customerId, items, paymentType, saleDate, note } = createSaleDto;
    
    // Find customer
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    // Get employee record for the current user (for commission calculation)
    const employee = await this.employeeRepository.findOne({ 
      where: { user: { id: currentUser?.id || createSaleDto.createdBy } },
      relations: ['company', 'shop', 'warehouse', 'user']
    });
    
    if (!employee) {
      throw new NotFoundException('Employee record not found for current user');
    }

    // Auto-determine warehouse and shop from employee assignment
    let warehouse = employee.warehouse;
    let shop = employee.shop;

    // If no warehouse/shop from employee, try from createSaleDto
    if (!warehouse && createSaleDto.warehouseId) {
      warehouse = await this.warehouseRepository.findOne({ where: { id: createSaleDto.warehouseId } });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
    }

    if (!shop && createSaleDto.shopId) {
      shop = await this.shopRepository.findOne({ where: { id: createSaleDto.shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
    }

    // Default to employee's primary warehouse if still not found
    if (!warehouse) {
      throw new NotFoundException('No warehouse assigned to employee or provided in request');
    }

    const sales = this.salesRepository.create({
      customer,
      warehouse,
      shop,
      paymentType,
      saleDate: saleDate || new Date(),
      note,
      createdBy: currentUser ? { id: currentUser.id } as User : null,
    });

    let totalAmount = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let subtotal = 0;
    const saleItems: SaleItem[] = [];

    // Process sale items and calculate totals
    for (const itemDto of items) {
      const product = await this.productRepository.findOne({ where: { id: itemDto.productId } });
      if (!product) throw new NotFoundException(`Product ${itemDto.productId} not found`);

      const saleItem = this.saleItemRepository.create({
        sales,
        product,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        subtotal: product.price * itemDto.quantity,
        total: product.price * itemDto.quantity,
        taxRate: product.taxRate,
        taxAmount: (product.price * itemDto.quantity * product.taxRate) / 100,
      });

      saleItem.discountAmount = 0; // Default for now
      
      subtotal += saleItem.subtotal;
      taxAmount += saleItem.taxAmount;
      discountAmount += saleItem.discountAmount;
      totalAmount += saleItem.total;

      saleItems.push(saleItem);
    }

    // Set calculated totals
    sales.items = saleItems;
    sales.totalAmount = totalAmount;
    sales.taxAmount = taxAmount;
    sales.discountAmount = discountAmount;
    sales.subtotal = subtotal;
    sales.remainingBalance = totalAmount - (sales.advancePayment || 0);

    const savedSale = await this.salesRepository.save(sales);
    await this.saleItemRepository.save(saleItems);

    // Update inventory levels for each sale item
    await this.updateInventoryOnSale(saleItems, warehouse, shop);

    // Auto-calculate and create commissions for each product
    for (const saleItem of saleItems) {
      const product = saleItem.product;
      
      // Use product-specific commission rate, fallback to employee base rate
      const commissionRate = product.commissionRate || employee.baseCommissionRate;
      const commissionAmount = (saleItem.total * commissionRate) / 100;

      if (commissionAmount > 0) {
        await this.commissionService.create({
          employeeId: employee.id,
          productId: product.id,
          saleId: savedSale.id,
          commissionRate: commissionRate,
          commissionAmount: commissionAmount,
        });
      }
    }
    
    // Log creation
    await this.createAuditLog(savedSale, currentUser?.id || 'system', AuditAction.CREATE);

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
    
    // Log update - using a placeholder for updatedBy since UpdateSaleDto doesn't have it
    await this.createAuditLog(updatedSale, 'system', AuditAction.UPDATE);

    return this.mapToResponseDto(updatedSale);
  }

  async remove(id: string): Promise<void> {
    const sale = await this.salesRepository.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');
    await this.salesRepository.delete(id);

    // Log deletion
    await this.createAuditLog(sale, null, AuditAction.DELETE);
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

  async applyPayment(saleId: string, paymentDto: CreatePaymentTransactionDto): Promise<PaymentTransactionResponseDto> {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');

    const transaction = this.paymentTransactionRepository.create({
      amount: paymentDto.amount,
      paymentMethod: paymentDto.paymentMethod,
      transactionType: paymentDto.transactionType,
      sale,
      transactionReference: paymentDto.transactionReference,
      notes: paymentDto.notes,
      paymentDetails: paymentDto.paymentDetails,
      processedBy: { id: paymentDto.processedBy } as User,
      isSuccessful: true,
    });

    const savedTransaction = await this.paymentTransactionRepository.save(transaction);

    // Update remaining balance
    sale.remainingBalance = Math.max(0, sale.totalAmount - sale.totalPaid);
    await this.salesRepository.save(sale);

    return this.mapToPaymentTransactionResponseDto(savedTransaction);
  }

  async updateStatus(saleId: string, status: SaleStatus, userId: string): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');

    const oldStatus = sale.status;
    sale.status = status;
    const updatedSale = await this.salesRepository.save(sale);

    // Log status update
    await this.createAuditLog(updatedSale, userId, AuditAction.UPDATE);

    await this.invalidateSaleCache();
    return this.mapToResponseDto(updatedSale);
  }

  async processSaleReturn(saleId: string, reason: string, userId: string): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId }, 
      relations: ['items', 'items.product'] 
    });
    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.status === SaleStatus.RETURNED) {
      throw new BadRequestException('Sale has already been returned');
    }

    // Update sale status to returned
    sale.status = SaleStatus.RETURNED;
    sale.note = `${sale.note || ''} [RETURN REASON: ${reason}]`;
    
    const updatedSale = await this.salesRepository.save(sale);

    // Create a return transaction
    const returnTransaction = this.paymentTransactionRepository.create({
      amount: sale.totalAmount,
      paymentMethod: sale.paymentType,
      transactionType: TransactionType.RETURN,
      sale,
      notes: `Return processed. Reason: ${reason}`,
      processedBy: { id: userId } as User,
      isSuccessful: true,
    });

    await this.paymentTransactionRepository.save(returnTransaction);

    // Log return
    await this.createAuditLog(updatedSale, userId, AuditAction.UPDATE);

    await this.invalidateSaleCache();
    return this.mapToResponseDto(updatedSale);
  }

  async getPaymentHistory(saleId: string): Promise<PaymentTransactionResponseDto[]> {
    const transactions = await this.paymentTransactionRepository.find({
      where: { sale: { id: saleId } },
      relations: ['processedBy'],
      order: { createdAt: 'DESC' }
    });

    return transactions.map(transaction => this.mapToPaymentTransactionResponseDto(transaction));
  }

  async getDailySalesReport(date?: string): Promise<any> {
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

    const result = await this.salesRepository
      .createQueryBuilder('sales')
      .select([
        'COUNT(sales.id) as totalSales',
        'SUM(sales.totalAmount) as totalRevenue',
        'AVG(sales.totalAmount) as averageSaleAmount',
        'SUM(sales.taxAmount) as totalTax',
        'SUM(sales.discountAmount) as totalDiscount'
      ])
      .where('sales.saleDate >= :startOfDay', { startOfDay })
      .andWhere('sales.saleDate <= :endOfDay', { endOfDay })
      .andWhere('sales.status != :cancelledStatus', { cancelledStatus: SaleStatus.CANCELLED })
      .getRawOne();

    return {
      date: reportDate.toISOString().split('T')[0],
      totalSales: parseInt(result.totalSales) || 0,
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      averageSaleAmount: parseFloat(result.averageSaleAmount) || 0,
      totalTax: parseFloat(result.totalTax) || 0,
      totalDiscount: parseFloat(result.totalDiscount) || 0,
    };
  }

  async getMonthlySalesReport(year?: number, month?: number): Promise<any> {
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || (currentDate.getMonth() + 1);

    const startOfMonth = new Date(reportYear, reportMonth - 1, 1);
    const endOfMonth = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

    const result = await this.salesRepository
      .createQueryBuilder('sales')
      .select([
        'COUNT(sales.id) as totalSales',
        'SUM(sales.totalAmount) as totalRevenue',
        'AVG(sales.totalAmount) as averageSaleAmount',
        'SUM(sales.taxAmount) as totalTax',
        'SUM(sales.discountAmount) as totalDiscount'
      ])
      .where('sales.saleDate >= :startOfMonth', { startOfMonth })
      .andWhere('sales.saleDate <= :endOfMonth', { endOfMonth })
      .andWhere('sales.status != :cancelledStatus', { cancelledStatus: SaleStatus.CANCELLED })
      .getRawOne();

    return {
      year: reportYear,
      month: reportMonth,
      totalSales: parseInt(result.totalSales) || 0,
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      averageSaleAmount: parseFloat(result.averageSaleAmount) || 0,
      totalTax: parseFloat(result.totalTax) || 0,
      totalDiscount: parseFloat(result.totalDiscount) || 0,
    };
  }

  private async createAuditLog(sale: Sales, userId: string | null, action: AuditAction): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      entityType: Sales.name,
      entityId: sale.id,
      action,
      user: userId ? { id: userId } as User : null,
      newValues: sale,
    });

    await this.auditLogRepository.save(auditLog);
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
      customerName: sales.customer?.name || '',
      warehouseName: sales.warehouse?.name || '',
      createdAt: sales.createdAt,
      updatedAt: sales.updatedAt,
    };
  }

  private mapToPaymentTransactionResponseDto(transaction: PaymentTransaction): PaymentTransactionResponseDto {
    return {
      id: transaction.id,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      transactionType: transaction.transactionType,
      transactionReference: transaction.transactionReference,
      notes: transaction.notes,
      transactionDate: transaction.transactionDate,
      paymentDetails: transaction.paymentDetails,
      isSuccessful: transaction.isSuccessful,
      failureReason: transaction.failureReason,
      saleId: transaction.sale.id,
      processedBy: transaction.processedBy?.id || '',
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private async invalidateSaleCache(): Promise<void> {
    try {
      const deletedCount = await this.cacheService.deletePattern(`${CACHE_KEYS.SALES_LIST}*`);
      this.logger.debug(`Cleared ${deletedCount} sale cache entries`);
    } catch (error) {
      this.logger.warn('Failed to invalidate sale cache:', error);
    }
  }

  /**
   * Update inventory levels when a sale is made
   */
  private async updateInventoryOnSale(saleItems: SaleItem[], warehouse: Warehouse, shop?: Shop): Promise<void> {
    for (const saleItem of saleItems) {
      const product = saleItem.product;
      const quantitySold = saleItem.quantity;

      // Update warehouse inventory
      if (warehouse) {
        const warehouseProduct = await this.warehouseProductRepository.findOne({
          where: { warehouse: { id: warehouse.id }, product: { id: product.id } }
        });

        if (warehouseProduct) {
          warehouseProduct.stockQuantity = Math.max(0, warehouseProduct.stockQuantity - quantitySold);
          await this.warehouseProductRepository.save(warehouseProduct);
        }
      }

      // Update shop inventory if sale is from shop
      if (shop) {
        const shopProduct = await this.shopProductRepository.findOne({
          where: { shop: { id: shop.id }, product: { id: product.id } }
        });

        if (shopProduct) {
          shopProduct.stockQuantity = Math.max(0, shopProduct.stockQuantity - quantitySold);
          await this.shopProductRepository.save(shopProduct);
        }
      }

      // Update main product stock quantity
      product.stockQuantity = Math.max(0, product.stockQuantity - quantitySold);
      await this.productRepository.save(product);
    }
  }

  /**
   * Get real-time inventory levels for a product at a specific location
   */
  async getInventoryLevels(productId: string, locationId: string, locationType: 'warehouse' | 'shop'): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    let locationStock = 0;
    let locationName = '';

    if (locationType === 'warehouse') {
      const warehouseProduct = await this.warehouseProductRepository.findOne({
        where: { warehouse: { id: locationId }, product: { id: productId } },
        relations: ['warehouse']
      });
      
      if (warehouseProduct) {
        locationStock = warehouseProduct.stockQuantity;
        locationName = warehouseProduct.warehouse.name;
      }
    } else if (locationType === 'shop') {
      const shopProduct = await this.shopProductRepository.findOne({
        where: { shop: { id: locationId }, product: { id: productId } },
        relations: ['shop']
      });
      
      if (shopProduct) {
        locationStock = shopProduct.stockQuantity;
        locationName = shopProduct.shop.name;
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      totalStock: product.stockQuantity,
      locationId,
      locationType,
      locationName,
      locationStock,
      minStockLevel: product.minStockLevel,
      isLowStock: locationStock <= product.minStockLevel,
      lastUpdated: new Date()
    };
  }

  async findCustomerByPhone(phone: string): Promise<any> {
    // Check if it's a customer
    const customer = await this.customerRepository.findOne({ 
      where: { phoneNumber: phone },
      select: ['id', 'name', 'phoneNumber', 'address']
    });
    
    if (customer) {
      return {
        type: 'customer',
        id: customer.id,
        name: customer.name,
        phone: customer.phoneNumber,
        address: customer.address
      };
    }

    // Check if it's a user
    const user = await this.userRepository.findOne({ 
      where: { phone },
      select: ['id', 'firstName', 'lastName', 'email', 'phone']
    });
    
    if (user) {
      return {
        type: 'user',
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone
      };
    }

    throw new NotFoundException('Customer or user not found with this phone number');
  }

  async getUserInfo(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'shop', 'warehouse'],
      select: ['id', 'firstName', 'lastName', 'role', 'email', 'phone']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['shop', 'warehouse']
    });

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        email: user.email,
        phone: user.phone
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name
      } : null,
      shop: user.shop ? {
        id: user.shop.id,
        name: user.shop.name,
        location: user.shop.location
      } : null,
      warehouse: user.warehouse ? {
        id: user.warehouse.id,
        name: user.warehouse.name,
        location: user.warehouse.location
      } : null,
      employee: employee ? {
        id: employee.id,
        shop: employee.shop ? {
          id: employee.shop.id,
          name: employee.shop.name
        } : null,
        warehouse: employee.warehouse ? {
          id: employee.warehouse.id,
          name: employee.warehouse.name
        } : null
      } : null
    };
  }
}
