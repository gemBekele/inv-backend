import { Entity, Column, ManyToOne, OneToMany, BeforeInsert, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Supplier } from '../../collections/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Branch } from '../../collections/entities/branch.entity';
import { Company } from '../../company/entities/company.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchasePayment } from './purchase-payment.entity';
import { PurchaseReceiving } from './purchase-receiving.entity';
import { 
  PurchaseOrderStatus, 
  ApprovalStatus, 
  PurchaseType,
  PurchasePaymentStatus 
} from '../enums/purchase.enums';

@Entity('purchase_orders')
@Index(['poNumber'], { unique: true })
@Index(['status'])
@Index(['orderDate'])
@Index(['expectedDeliveryDate'])
export class PurchaseOrder extends BaseEntity {
  @Column({ length: 50, unique: true })
  poNumber: string;

  @Column({ type: 'enum', enum: PurchaseType, default: PurchaseType.STOCK_PURCHASE })
  purchaseType: PurchaseType;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus;

  @Column({ type: 'enum', enum: PurchasePaymentStatus, default: PurchasePaymentStatus.UNPAID })
  paymentStatus: PurchasePaymentStatus;

  @Column({ type: 'date' })
  orderDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate?: Date;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherCharges: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ length: 100, nullable: true })
  supplierInvoiceNumber?: string;

  @Column({ length: 100, nullable: true })
  referenceNumber?: string;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => Supplier, supplier => supplier.id, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Branch, branch => branch.id, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @ManyToOne(() => Company, company => company.id)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => PurchaseItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseItem[];

  @OneToMany(() => PurchasePayment, payment => payment.purchaseOrder)
  payments: PurchasePayment[];

  @OneToMany(() => PurchaseReceiving, receiving => receiving.purchaseOrder)
  receivings: PurchaseReceiving[];

  @BeforeInsert()
  setDefaults() {
    if (!this.orderDate) {
      this.orderDate = new Date();
    }
    
    if (!this.poNumber) {
      this.generatePONumber();
    }

    // Set due date based on payment terms
    if (!this.dueDate && this.paymentTermsDays) {
      this.dueDate = new Date(this.orderDate);
      this.dueDate.setDate(this.dueDate.getDate() + this.paymentTermsDays);
    }
  }

  private generatePONumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.poNumber = `PO-${timestamp}-${random}`;
  }

  // Computed properties
  get isOverdue(): boolean {
    if (!this.dueDate || this.paymentStatus === PurchasePaymentStatus.FULLY_PAID) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  get totalReceived(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  }

  get totalOrdered(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get receivingPercentage(): number {
    const totalOrdered = this.totalOrdered;
    if (totalOrdered === 0) return 0;
    return (this.totalReceived / totalOrdered) * 100;
  }

  get canBeApproved(): boolean {
    return this.status === PurchaseOrderStatus.PENDING && 
           this.approvalStatus === ApprovalStatus.PENDING;
  }

  get canBeReceived(): boolean {
    return this.status === PurchaseOrderStatus.APPROVED || 
           this.status === PurchaseOrderStatus.ORDERED ||
           this.status === PurchaseOrderStatus.PARTIALLY_RECEIVED;
  }
}
