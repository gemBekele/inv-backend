import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PaginationDto } from '@/common/dto';
import { PaginatedResult } from '@/common/interfaces';
import { BaseMultiTenantService } from '@/common/services/base-multi-tenant.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { PurchaseReceiving } from './entities/purchase-receiving.entity';
import { PurchaseReceivingItem } from './entities/purchase-receiving-item.entity';
import { 
  PurchaseOrderStatus, 
  ApprovalStatus, 
  PurchasePaymentStatus,
  ReceivingStatus 
} from './enums';
import { PurchaseOrderQueryDto, CreatePurchaseOrderWithNewProductDto } from './dto';
import { ProductsService } from '../products/products.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PurchaseService extends BaseMultiTenantService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseItem)
    private purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(PurchasePayment)
    private purchasePaymentRepository: Repository<PurchasePayment>,
    @InjectRepository(PurchaseReceiving)
    private purchaseReceivingRepository: Repository<PurchaseReceiving>,
    @InjectRepository(PurchaseReceivingItem)
    private purchaseReceivingItemRepository: Repository<PurchaseReceivingItem>,
    private productsService: ProductsService,
  ) {
    super();
  }

  async createPurchaseOrder(createPurchaseOrderDto: any, userId: string, user?: User): Promise<PurchaseOrder> {
    // Calculate totals for items first
    let subtotal = 0;
    const processedItems = createPurchaseOrderDto.items?.map((item: any) => {
      const totalCost = item.quantity * item.unitCost;
      subtotal += totalCost;
      return {
        ...item,
        totalCost,
        product: { id: item.productId }
      };
    }) || [];

    const purchaseOrder = this.purchaseOrderRepository.create({
      ...createPurchaseOrderDto,
      items: processedItems,
      createdBy: { id: userId } as any,
      supplier: { id: createPurchaseOrderDto.supplierId },
      warehouse: { id: createPurchaseOrderDto.warehouseId },
      company: { id: user?.company?.id || user?.companyId },
      subtotal,
    }) as unknown as PurchaseOrder;

    purchaseOrder.totalAmount = subtotal + (purchaseOrder.taxAmount || 0) + (purchaseOrder.shippingCost || 0) + (purchaseOrder.otherCharges || 0) - (purchaseOrder.discountAmount || 0);
    purchaseOrder.remainingAmount = purchaseOrder.totalAmount;

    return await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async createPurchaseOrderWithNewProduct(createDto: CreatePurchaseOrderWithNewProductDto, userId: string, user: User): Promise<PurchaseOrder> {
    // Create products first
    const createdProducts = [];
    for (const item of createDto.items) {
      const productDto = {
        ...item.product,
        companyId: createDto.companyId || user.company?.id,
        stockQuantity: 0, // New products start with 0 stock
        minStockLevel: 0,
        trackStock: true
      };
      const createdProduct = await this.productsService.create(productDto, userId, user);
      createdProducts.push({ ...item, productId: createdProduct.id });
    }

    // Create purchase order with created products
    const purchaseOrderDto = {
      ...createDto,
      items: createdProducts.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        discountRate: item.discountRate,
        taxRate: item.taxRate,
        expectedDeliveryDate: item.expectedDeliveryDate,
        notes: item.notes,
        specifications: item.specifications
      }))
    };

    return await this.createPurchaseOrder(purchaseOrderDto, userId, user);
  }

  async getPayables(
    paginationDto: PurchaseOrderQueryDto,
    user?: User,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.branch', 'branch')
      .leftJoinAndSelect('po.company', 'company')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('po.payments', 'payments');

    // Apply company filtering if user is provided
    if (user) {
      queryBuilder.andWhere('po.company.id = :userCompanyId', {
        userCompanyId: user.company?.id || (user as any).companyId
      });
    }

    // Filter for credit purchases (unpaid or partially paid with payment terms > 0)
    queryBuilder.andWhere('po.paymentTermsDays > 0');
    queryBuilder.andWhere('(po.paymentStatus = :unpaid OR po.paymentStatus = :partial)', {
      unpaid: PurchasePaymentStatus.UNPAID,
      partial: PurchasePaymentStatus.PARTIALLY_PAID
    });

    const [items, total] = await queryBuilder
      .orderBy('po.orderDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findAll(
    paginationDto: PurchaseOrderQueryDto,
    filters?: {
      status?: PurchaseOrderStatus[];
      supplierId?: string;
      warehouseId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    user?: User,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.branch', 'branch')
      .leftJoinAndSelect('po.company', 'company')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply company filtering if user is provided
    if (user) {
      queryBuilder.andWhere('po.company.id = :userCompanyId', {
        userCompanyId: user.company?.id || (user as any).companyId
      });
    }

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        queryBuilder.andWhere('po.status IN (:...statuses)', { statuses: filters.status });
      }
      if (filters.supplierId) {
        queryBuilder.andWhere('po.supplier.id = :supplierId', { supplierId: filters.supplierId });
      }
      if (filters.warehouseId) {
        queryBuilder.andWhere('po.warehouse.id = :warehouseId', { warehouseId: filters.warehouseId });
      }
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('po.orderDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      }
    }

    const [items, total] = await queryBuilder
      .orderBy('po.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: [
        'supplier',
        'warehouse',
        'branch',
        'company',
        'items',
        'items.product',
        'payments',
        'receivings',
        'receivings.items',
        'createdBy',
        'approvedBy',
      ],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async approvePurchaseOrder(id: string, userId: string, approvalNotes?: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (!purchaseOrder.canBeApproved) {
      throw new BadRequestException('Purchase order cannot be approved in its current state');
    }

    purchaseOrder.status = PurchaseOrderStatus.APPROVED;
    purchaseOrder.approvalStatus = ApprovalStatus.APPROVED;
    purchaseOrder.approvedBy = { id: userId } as any;
    purchaseOrder.approvalNotes = approvalNotes;

    return await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async rejectPurchaseOrder(id: string, userId: string, rejectionReason: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id);

    if (!purchaseOrder.canBeApproved) {
      throw new BadRequestException('Purchase order cannot be rejected in its current state');
    }

    purchaseOrder.status = PurchaseOrderStatus.REJECTED;
    purchaseOrder.approvalStatus = ApprovalStatus.REJECTED;
    purchaseOrder.approvedBy = { id: userId } as any;
    purchaseOrder.approvalNotes = rejectionReason;

    return await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async createReceiving(createReceivingDto: any, userId: string): Promise<PurchaseReceiving> {
    const purchaseOrder = await this.findOne(createReceivingDto.purchaseOrderId);

    if (!purchaseOrder.canBeReceived) {
      throw new BadRequestException('Purchase order cannot be received in its current state');
    }

    const receiving = this.purchaseReceivingRepository.create({
      ...createReceivingDto,
      purchaseOrder,
      receivedBy: { id: userId } as any,
    }) as unknown as PurchaseReceiving;

    return await this.purchaseReceivingRepository.save(receiving);
  }

  async completePayment(paymentId: string, userId: string): Promise<PurchasePayment> {
    const payment = await this.purchasePaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['purchaseOrder']
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status === 'completed') {
      throw new BadRequestException('Payment is already completed');
    }

    payment.status = 'completed' as any;
    const savedPayment = await this.purchasePaymentRepository.save(payment);

    // Update purchase order payment status
    await this.updatePurchaseOrderPaymentStatus(payment.purchaseOrder.id);

    return savedPayment;
  }

  async addPayment(createPaymentDto: any, userId: string): Promise<PurchasePayment> {
    const purchaseOrder = await this.findOne(createPaymentDto.purchaseOrderId);

    // Validate payment amount doesn't exceed remaining amount
    if (createPaymentDto.amount > purchaseOrder.remainingAmount) {
      throw new BadRequestException('Payment amount cannot exceed remaining amount');
    }

    const payment = this.purchasePaymentRepository.create({
      ...createPaymentDto,
      purchaseOrder,
      processedBy: { id: userId } as any,
    }) as unknown as PurchasePayment;

    const savedPayment = await this.purchasePaymentRepository.save(payment) as PurchasePayment;

    // Update purchase order payment status
    await this.updatePurchaseOrderPaymentStatus(purchaseOrder.id);

    return savedPayment;
  }

  async updatePurchaseOrderPaymentStatus(purchaseOrderId: string): Promise<void> {
    try {
      const purchaseOrder = await this.findOne(purchaseOrderId);
      
      // Calculate total paid amount from completed payments
      const totalPaid = (purchaseOrder.payments || [])
        .filter(p => p.status === 'completed') // Use string comparison instead of getter
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      purchaseOrder.paidAmount = totalPaid;
      purchaseOrder.remainingAmount = parseFloat(purchaseOrder.totalAmount.toString()) - totalPaid;

      if (totalPaid >= parseFloat(purchaseOrder.totalAmount.toString())) {
        purchaseOrder.paymentStatus = PurchasePaymentStatus.FULLY_PAID;
      } else if (totalPaid > 0) {
        purchaseOrder.paymentStatus = PurchasePaymentStatus.PARTIALLY_PAID;
      } else {
        purchaseOrder.paymentStatus = PurchasePaymentStatus.UNPAID;
      }

      // Check if overdue
      if (purchaseOrder.isOverdue && purchaseOrder.paymentStatus !== PurchasePaymentStatus.FULLY_PAID) {
        purchaseOrder.paymentStatus = PurchasePaymentStatus.OVERDUE;
      }

      await this.purchaseOrderRepository.save(purchaseOrder);
    } catch (error) {
      console.error('Error updating purchase order payment status:', error);
      // Don't throw the error to avoid breaking payment creation
    }
  }

  async getDashboardStats(filters?: { startDate?: Date; endDate?: Date }, user?: User): Promise<any> {
    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.company', 'company');

    // Apply company filtering if user is provided
    if (user) {
      queryBuilder.andWhere('po.company.id = :userCompanyId', {
        userCompanyId: user.company?.id || (user as any).companyId
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('po.orderDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const totalOrders = await queryBuilder.getCount();
    
    const pendingOrders = await queryBuilder
      .clone()
      .andWhere('po.status = :status', { status: PurchaseOrderStatus.PENDING })
      .getCount();

    const approvedOrders = await queryBuilder
      .clone()
      .andWhere('po.status = :status', { status: PurchaseOrderStatus.APPROVED })
      .getCount();

    const totalAmount = await queryBuilder
      .select('SUM(po.totalAmount)', 'total')
      .getRawOne();

    const overdueOrders = await queryBuilder
      .clone()
      .andWhere('po.paymentStatus = :status', { status: PurchasePaymentStatus.OVERDUE })
      .getCount();

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      totalAmount: totalAmount?.total || 0,
      overdueOrders,
    };
  }

  async getReceivingStats(user?: User): Promise<any> {
    const queryBuilder = this.purchaseReceivingRepository.createQueryBuilder('receiving')
      .leftJoinAndSelect('receiving.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('purchaseOrder.company', 'company');

    // Apply company filtering if user is provided
    if (user) {
      queryBuilder.andWhere('company.id = :userCompanyId', {
        userCompanyId: user.company?.id || (user as any).companyId
      });
    }

    const totalReceivings = await queryBuilder.getCount();
    
    const pendingReceivings = await queryBuilder
      .clone()
      .andWhere('receiving.status = :status', { status: ReceivingStatus.PENDING })
      .getCount();
      
    const completedReceivings = await queryBuilder
      .clone()
      .andWhere('receiving.status = :status', { status: ReceivingStatus.COMPLETE })
      .getCount();

    return {
      totalReceivings,
      pendingReceivings,
      completedReceivings,
    };
  }
}
