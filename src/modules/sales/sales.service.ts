import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { CreateSaleDto, UpdateSaleDto, SaleQueryDto, SaleResponseDto } from './dto';
import { PaginatedResult } from '../../common/interfaces';
import { CacheService } from '@/shared/cache/cache.service';
import { CACHE_KEYS } from '../../common/constants';
import { BaseMultiTenantService } from '../../common/services/base-multi-tenant.service';
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
import { Credit } from '../credit/entities/credit.entity';
import { CreditService } from '../credit/credit.service';
import { CreditType } from '../credit/enums';
import { UserRole } from '../../common/enums';

@Injectable()
export class SalesService extends BaseMultiTenantService {
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
    private readonly creditService: CreditService,
  ) {
    super();
  }

  async create(createSaleDto: CreateSaleDto, currentUser?: any): Promise<SaleResponseDto> {
    const { customerId, items, paymentType, saleDate, note } = createSaleDto;
    
    // Set company context if user is provided
    if (currentUser) {
      const contextData = this.setCompanyContext({ companyId: createSaleDto.companyId }, currentUser);
      createSaleDto.companyId = contextData.companyId;
    }
    
    // Find customer with company filtering
    const customerQuery = this.customerRepository.createQueryBuilder('customer')
      .where('customer.id = :customerId', { customerId });
    
    if (currentUser?.company?.id) {
      customerQuery.andWhere('customer.companyId = :companyId', { companyId: currentUser.company.id });
    }
    
    const customer = await customerQuery.getOne();
    if (!customer) throw new NotFoundException('Customer not found');

    // Get employee record for the current user (for commission calculation)
    const employee = await this.employeeRepository.findOne({ 
      where: { user: { id: currentUser?.id || createSaleDto.createdBy } },
      relations: ['company', 'shop', 'warehouse', 'user']
    });
    
    if (!employee) {
      throw new NotFoundException('Employee record not found for current user');
    }

    // Auto-determine warehouse and shop from employee assignment with company filtering
    let warehouse = employee.warehouse;
    let shop = employee.shop;

    // If no warehouse/shop from employee, try from createSaleDto with company filtering
    if (!warehouse && createSaleDto.warehouseId) {
      const warehouseQuery = this.warehouseRepository.createQueryBuilder('warehouse')
        .where('warehouse.id = :warehouseId', { warehouseId: createSaleDto.warehouseId });
      
      if (currentUser?.company?.id) {
        warehouseQuery.andWhere('warehouse.companyId = :companyId', { companyId: currentUser.company.id });
      }
      
      warehouse = await warehouseQuery.getOne();
      if (!warehouse) throw new NotFoundException('Warehouse not found or not accessible');
    }

    if (!shop && createSaleDto.shopId) {
      const shopQuery = this.shopRepository.createQueryBuilder('shop')
        .where('shop.id = :shopId', { shopId: createSaleDto.shopId });
      
      if (currentUser?.company?.id) {
        shopQuery.andWhere('shop.companyId = :companyId', { companyId: currentUser.company.id });
      }
      
      shop = await shopQuery.getOne();
      if (!shop) throw new NotFoundException('Shop not found or not accessible');
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
      status: SaleStatus.COMPLETED, // Auto-approve all sales
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

      // Check inventory availability
      let availableStock = product.stockQuantity;
      
      // Check warehouse-specific stock if warehouse is specified
      if (warehouse) {
        const warehouseProduct = await this.warehouseProductRepository.findOne({
          where: { warehouse: { id: warehouse.id }, product: { id: product.id } }
        });
        if (warehouseProduct) {
          availableStock = warehouseProduct.stockQuantity;
        }
      }
      
      // Check shop-specific stock if shop is specified
      if (shop) {
        const shopProduct = await this.shopProductRepository.findOne({
          where: { shop: { id: shop.id }, product: { id: product.id } }
        });
        if (shopProduct) {
          availableStock = shopProduct.stockQuantity;
        }
      }
      
      // Validate stock availability
      if (itemDto.quantity > availableStock) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${itemDto.quantity}`
        );
      }

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

    // Handle credit sales creation if payment type is credit
    if (paymentType === PaymentType.CREDIT) {
      this.logger.log(`Creating credit record for sales ${savedSale.id}`);
      try {
        // Check customer credit eligibility first
        if (customer.creditLimit && customer.creditLimit > 0) {
          const currentCreditBalance = customer.currentCreditBalance || 0;
          const availableCredit = customer.creditLimit - currentCreditBalance;
          
          if (totalAmount > availableCredit) {
            this.logger.warn(`Credit limit exceeded for customer ${customer.id}. Required: ${totalAmount}, Available: ${availableCredit}`);
            // Continue with credit creation but log the warning
          }
        }

        // Ensure we have proper user context for credit creation
        const creditUser = currentUser || {
          id: employee.user?.id || 'system',
          company: { id: employee.company?.id || createSaleDto.companyId },
          role: currentUser?.role || 'company_admin'
        };

        // Create credit record with proper context
        const creditDto = {
          type: CreditType.RECEIVABLE,
          principalAmount: totalAmount,
          customerId: customer.id,
          paymentTermsDays: customer.paymentTermsDays || 30,
          interestRate: customer.interestRate || 0,
          description: `Credit for sale ${savedSale.invoiceNumber || savedSale.id}`,
          notes: `Credit created from sales ${savedSale.invoiceNumber || savedSale.id}`,
          metadata: { 
            saleId: savedSale.id,
            invoiceNumber: savedSale.invoiceNumber,
            customerName: customer.name,
            warehouseId: warehouse?.id,
            shopId: shop?.id
          }
        };

        await this.creditService.create(creditDto, creditUser as any);
        
        this.logger.log(`Credit record created successfully for sales ${savedSale.id}`);
      } catch (error) {
        this.logger.error(`Failed to create credit record for sales ${savedSale.id}: ${error.message}`, error.stack);
        // Log detailed error for debugging
        this.logger.error('Credit creation error details:', {
          saleId: savedSale.id,
          customerId: customer.id,
          totalAmount,
          currentUser: currentUser?.id,
          employee: employee?.id,
          error: error.message
        });
        // Continue with sale completion even if credit creation fails
        // In production, you might want to implement compensation logic
      }
    }

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

  async findAll(query: SaleQueryDto, user?: User): Promise<PaginatedResult<SaleResponseDto>> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SALES_LIST, JSON.stringify(query), user?.company?.id || 'no-company');
    const cached = await this.cacheService.get<PaginatedResult<SaleResponseDto>>(cacheKey);
    if (cached) return cached;

    const queryBuilder = this.createQueryBuilder();
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilterForSales(queryBuilder, user);
    }
    
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

  async findOne(id: string, user?: User): Promise<SaleResponseDto> {
    const cacheKey = this.cacheService.generateKey(CACHE_KEYS.SALE_DETAIL, id, user?.company?.id || 'no-company');
    const cached = await this.cacheService.get<SaleResponseDto>(cacheKey);
    if (cached) return cached;

    const queryBuilder = this.salesRepository.createQueryBuilder('sales')
      .leftJoinAndSelect('sales.customer', 'customer')
      .leftJoinAndSelect('sales.warehouse', 'warehouse')
      .leftJoinAndSelect('sales.items', 'items')
      .where('sales.id = :id', { id });
    
    // Apply company filtering
    if (user) {
      this.applyCompanyFilterForSales(queryBuilder, user);
    }
    
    const sale = await queryBuilder.getOne();
    if (!sale) throw new NotFoundException('Sale not found');
    const result = this.mapToResponseDto(sale);
    await this.cacheService.set(cacheKey, result, 600000);
    return result;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({ 
      where: { id }, 
      relations: ['customer', 'warehouse', 'shop'] 
    });
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
      .leftJoinAndSelect('sales.customer', 'customer')
      .leftJoinAndSelect('sales.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.company', 'warehouseCompany')
      .leftJoinAndSelect('sales.shop', 'shop')
      .leftJoinAndSelect('shop.company', 'shopCompany')
      .leftJoinAndSelect('sales.items', 'items')
      .leftJoinAndSelect('items.product', 'product');
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

  async applyPayment(saleId: string, paymentDto: CreatePaymentTransactionDto, currentUser?: any): Promise<PaymentTransactionResponseDto> {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId }, 
      relations: ['customer']
    });
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

    // If this was a credit sale, process credit payment
    if (sale.paymentType === PaymentType.CREDIT) {
      try {
        // Find the credit record associated with this sale
        // For now, we'll skip credit payment processing since we need a better way to link
        // In a production system, you'd want to add a saleId field to the Credit entity
        this.logger.warn('Credit payment processing skipped - need better sale-credit linking');
        // const creditQuery = new CreditQueryDto();
        // creditQuery.page = 1;
        // creditQuery.limit = 10;
        // const credits = await this.creditService.findAll(creditQuery, currentUser);

        // if (credits.data && credits.data.length > 0) {
        //   const credit = credits.data[0];
        //   // Create payment for the credit  
        //   await this.creditService.createPayment(credit.id, {
        //     amount: paymentDto.amount,
        //     paymentMethod: paymentDto.paymentMethod,
        //     notes: paymentDto.notes,
        //   }, currentUser || { id: paymentDto.processedBy, company: { id: currentUser?.company?.id } });
        //   
        //   this.logger.log(`Credit payment processed for sale ${saleId}`);
        // }
      } catch (error) {
        this.logger.error(`Failed to process credit payment for sale ${saleId}: ${error.message}`);
        // Continue with regular payment processing even if credit payment fails
      }
    }

    return this.mapToPaymentTransactionResponseDto(savedTransaction);
  }

  async updateStatus(saleId: string, status: SaleStatus, userId: string): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({ 
      where: { id: saleId },
      relations: ['customer', 'warehouse', 'shop']
    });
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
      relations: ['items', 'items.product', 'customer', 'warehouse', 'shop'] 
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
      invoiceNumber: sales.invoiceNumber,
      totalAmount: sales.totalAmount,
      subtotal: sales.subtotal,
      taxAmount: sales.taxAmount,
      discountAmount: sales.discountAmount,
      advancePayment: sales.advancePayment,
      remainingBalance: sales.remainingBalance,
      saleDate: sales.saleDate,
      paymentType: sales.paymentType,
      status: sales.status,
      note: sales.note,
      customerName: sales.customer?.name || '',
      customerId: sales.customer?.id || '',
      warehouseName: sales.warehouse?.name || '',
      warehouseId: sales.warehouse?.id || '',
      shopName: sales.shop?.name,
      shopId: sales.shop?.id,
      items: sales.items?.map(item => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        discountAmount: Number(item.discountAmount),
        total: Number(item.total),
      })) || [],
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
   * Apply company filtering for sales based on user role and company
   */
  private applyCompanyFilterForSales(queryBuilder: SelectQueryBuilder<Sales>, user: User): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all sales
      return;
    }

    if (user.company?.id) {
      // Filter by company ID through warehouse or shop company relationship
      queryBuilder.andWhere(
        '(warehouseCompany.id = :companyId OR shopCompany.id = :companyId)',
        { companyId: user.company.id }
      );
    } else {
      // If no company, show no sales
      queryBuilder.andWhere('1 = 0');
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
      relations: ['company', 'company.warehouses', 'company.shops', 'shop', 'warehouse'],
      select: ['id', 'firstName', 'lastName', 'role', 'email', 'phone']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
      relations: ['shop', 'warehouse', 'company', 'company.warehouses', 'company.shops']
    });

    // Determine warehouse and shop - use direct assignment or fall back to company's first warehouse/shop
    let effectiveWarehouse = user.warehouse || employee?.warehouse;
    let effectiveShop = user.shop || employee?.shop;
    
    // If no warehouse assigned, use the first warehouse from company
    if (!effectiveWarehouse && user.company?.warehouses?.length > 0) {
      effectiveWarehouse = user.company.warehouses[0];
    }
    
    // If no shop assigned, use the first shop from company (if any)
    if (!effectiveShop && user.company?.shops?.length > 0) {
      effectiveShop = user.company.shops[0];
    }

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
      shop: effectiveShop ? {
        id: effectiveShop.id,
        name: effectiveShop.name,
        location: effectiveShop.location
      } : null,
      warehouse: effectiveWarehouse ? {
        id: effectiveWarehouse.id,
        name: effectiveWarehouse.name,
        location: effectiveWarehouse.location
      } : null,
      employee: employee ? {
        id: employee.id,
        shop: employee.shop ? {
          id: employee.shop.id,
          name: employee.shop.name
        } : effectiveShop ? {
          id: effectiveShop.id,
          name: effectiveShop.name
        } : null,
        warehouse: employee.warehouse ? {
          id: employee.warehouse.id,
          name: employee.warehouse.name
        } : effectiveWarehouse ? {
          id: effectiveWarehouse.id,
          name: effectiveWarehouse.name
        } : null
      } : null
    };
  }

  /**
   * Get commission information for an employee's sale
   */
  async getEmployeeSaleCommissions(saleId: string, employeeId: string): Promise<any> {
    // This would integrate with the commission service to get commission details
    // For now, return a placeholder structure showing what commissions were calculated
    const sale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['items', 'items.product']
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Calculate commission information for each item
    const commissions = sale.items.map(item => {
      const commissionRate = item.product.commissionRate || employee.baseCommissionRate;
      const commissionAmount = (item.total * commissionRate) / 100;

      return {
        productId: item.product.id,
        productName: item.product.name,
        saleItemId: item.id,
        quantity: item.quantity,
        itemTotal: item.total,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        status: 'calculated'
      };
    });

    const totalCommission = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

    return {
      saleId: sale.id,
      employeeId: employee.id,
      employeeName: employee.name,
      totalSaleAmount: sale.totalAmount,
      totalCommissionAmount: totalCommission,
      commissionDetails: commissions,
      calculatedAt: new Date()
    };
  }
}
