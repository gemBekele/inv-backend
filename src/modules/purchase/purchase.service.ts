import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PaginationDto } from '@/common/dto';
import { PaginatedResult } from '@/common/interfaces';
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
export class PurchaseService {
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
  ) {}

  async createPurchaseOrder(createPurchaseOrderDto: any, userId: string): Promise<PurchaseOrder> {
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

    return await this.createPurchaseOrder(purchaseOrderDto, userId);
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
  ): Promise<PaginatedResult<PurchaseOrder>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.branch', 'branch')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

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

  async addPayment(createPaymentDto: any, userId: string): Promise<PurchasePayment> {
    const purchaseOrder = await this.findOne(createPaymentDto.purchaseOrderId);

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
    const purchaseOrder = await this.findOne(purchaseOrderId);
    const totalPaid = (purchaseOrder.payments || [])
      .filter(p => p.isSuccessful)
      .reduce((sum, p) => sum + p.amount, 0);

    purchaseOrder.paidAmount = totalPaid;
    purchaseOrder.remainingAmount = purchaseOrder.totalAmount - totalPaid;

    if (totalPaid >= purchaseOrder.totalAmount) {
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
  }

  async getDashboardStats(filters?: { startDate?: Date; endDate?: Date }): Promise<any> {
    const queryBuilder = this.purchaseOrderRepository.createQueryBuilder('po');

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.where('po.orderDate BETWEEN :startDate AND :endDate', {
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

  async getReceivingStats(): Promise<any> {
    const totalReceivings = await this.purchaseReceivingRepository.count();
    const pendingReceivings = await this.purchaseReceivingRepository.count({
      where: { status: ReceivingStatus.PENDING },
    });
    const completedReceivings = await this.purchaseReceivingRepository.count({
      where: { status: ReceivingStatus.COMPLETE },
    });

    return {
      totalReceivings,
      pendingReceivings,
      completedReceivings,
    };
  }
}
