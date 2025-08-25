import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentType } from '../../sales/enums/sales.enums';

export enum PurchasePaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

@Entity('purchase_payments')
@Index(['paymentDate'])
@Index(['status'])
@Index(['paymentMethod'])
export class PurchasePayment extends BaseEntity {
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentType })
  paymentMethod: PaymentType;

  @Column({ type: 'enum', enum: PurchasePaymentStatus, default: PurchasePaymentStatus.PENDING })
  status: PurchasePaymentStatus;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ length: 100, nullable: true })
  referenceNumber?: string;

  @Column({ length: 100, nullable: true })
  checkNumber?: string;

  @Column({ length: 255, nullable: true })
  bankAccount?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  paymentDetails?: Record<string, any>; // For additional payment gateway details

  @Column({ type: 'boolean', default: false })
  isReconciled: boolean;

  @Column({ type: 'date', nullable: true })
  reconciledDate?: Date;

  @Column({ length: 50, unique: true })
  transactionNumber: string;

  // Relationships
  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.payments)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'reconciled_by' })
  reconciledBy?: User;

  @BeforeInsert()
  setDefaults() {
    if (!this.paymentDate) {
      this.paymentDate = new Date();
    }
    
    if (!this.transactionNumber) {
      this.generateTransactionNumber();
    }
  }

  private generateTransactionNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.transactionNumber = `PAY-${timestamp}-${random}`;
  }

  // Computed properties
  get isSuccessful(): boolean {
    return this.status === PurchasePaymentStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === PurchasePaymentStatus.PENDING;
  }

  get isFailed(): boolean {
    return this.status === PurchasePaymentStatus.FAILED || 
           this.status === PurchasePaymentStatus.CANCELLED;
  }
}
