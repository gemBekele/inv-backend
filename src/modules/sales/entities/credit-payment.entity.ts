import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { CreditSales } from './credit-sales.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentType } from '../enums/sales.enums';

export enum CreditPaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed'
}

export enum CreditPaymentType {
  PAYMENT = 'payment',
  PARTIAL_PAYMENT = 'partial_payment',
  OVERPAYMENT = 'overpayment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  WRITE_OFF = 'write_off'
}

@Entity('credit_payments')
@Index(['paymentNumber'], { unique: true })
@Index(['paymentDate'])
@Index(['status'])
@Index(['paymentType'])
export class CreditPayment extends BaseEntity {
  @Column({ length: 50, unique: true })
  paymentNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentType })
  paymentMethod: PaymentType;

  @Column({ type: 'enum', enum: CreditPaymentStatus, default: CreditPaymentStatus.PENDING })
  status: CreditPaymentStatus;

  @Column({ type: 'enum', enum: CreditPaymentType, default: CreditPaymentType.PAYMENT })
  paymentType: CreditPaymentType;

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
  paymentDetails?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isReconciled: boolean;

  @Column({ type: 'date', nullable: true })
  reconciledDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appliedToPrincipal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appliedToInterest: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appliedToFees: number;

  // Relationships
  @ManyToOne(() => CreditSales, creditSales => creditSales.payments)
  @JoinColumn({ name: 'credit_sales_id' })
  creditSales: CreditSales;

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
    
    if (!this.paymentNumber) {
      this.generatePaymentNumber();
    }
  }

  private generatePaymentNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.paymentNumber = `CP-${timestamp}-${random}`;
  }

  // Computed properties
  get isSuccessful(): boolean {
    return this.status === CreditPaymentStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === CreditPaymentStatus.PENDING;
  }

  get isFailed(): boolean {
    return this.status === CreditPaymentStatus.FAILED || 
           this.status === CreditPaymentStatus.CANCELLED;
  }

  get isReversed(): boolean {
    return this.status === CreditPaymentStatus.REVERSED;
  }

  get totalApplied(): number {
    return this.appliedToPrincipal + this.appliedToInterest + this.appliedToFees;
  }

  get hasUnappliedAmount(): boolean {
    return this.amount > this.totalApplied;
  }

  get unappliedAmount(): number {
    return this.amount - this.totalApplied;
  }
}
