import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Sales } from './sales.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { CreditPayment } from './credit-payment.entity';

export enum CreditStatus {
  ACTIVE = 'active',
  PARTIALLY_PAID = 'partially_paid',
  FULLY_PAID = 'fully_paid',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export enum CreditTerms {
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_45 = 'net_45',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  CUSTOM = 'custom'
}

@Entity('credit_sales')
@Index(['creditNumber'], { unique: true })
@Index(['status'])
@Index(['dueDate'])
@Index(['issueDate'])
export class CreditSales extends BaseEntity {
  @Column({ length: 50, unique: true })
  creditNumber: string;

  @Column({ type: 'enum', enum: CreditStatus, default: CreditStatus.ACTIVE })
  status: CreditStatus;

  @Column({ type: 'enum', enum: CreditTerms, default: CreditTerms.NET_30 })
  creditTerms: CreditTerms;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCreditAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number; // Annual interest rate for overdue amounts

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interestAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lateFeeAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions?: string;

  @Column({ type: 'boolean', default: false })
  isDisputed: boolean;

  @Column({ type: 'text', nullable: true })
  disputeReason?: string;

  @Column({ type: 'date', nullable: true })
  lastReminderSent?: Date;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => Sales, sales => sales.id, { eager: true })
  @JoinColumn({ name: 'sales_id' })
  sales: Sales;

  @ManyToOne(() => Customer, customer => customer.id, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => CreditPayment, payment => payment.creditSales)
  payments: CreditPayment[];

  @BeforeInsert()
  setDefaults() {
    if (!this.issueDate) {
      this.issueDate = new Date();
    }
    
    if (!this.creditNumber) {
      this.generateCreditNumber();
    }

    // Set due date based on payment terms
    if (!this.dueDate) {
      this.dueDate = new Date(this.issueDate);
      this.dueDate.setDate(this.dueDate.getDate() + this.paymentTermsDays);
    }

    // Initialize remaining balance
    if (!this.remainingBalance) {
      this.remainingBalance = this.totalCreditAmount;
    }
  }

  private generateCreditNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.creditNumber = `CR-${timestamp}-${random}`;
  }

  // Computed properties
  get isOverdue(): boolean {
    return !this.isFullyPaid && new Date() > this.dueDate;
  }

  get isFullyPaid(): boolean {
    return this.status === CreditStatus.FULLY_PAID || this.remainingBalance <= 0;
  }

  get isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.remainingBalance > 0;
  }

  get daysPastDue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get paymentPercentage(): number {
    if (this.totalCreditAmount === 0) return 0;
    return (this.paidAmount / this.totalCreditAmount) * 100;
  }

  get totalAmountDue(): number {
    return this.remainingBalance + this.interestAmount + this.lateFeeAmount;
  }

  get agingCategory(): string {
    const days = this.daysPastDue;
    if (days <= 0) return 'Current';
    if (days <= 30) return '1-30 days';
    if (days <= 60) return '31-60 days';
    if (days <= 90) return '61-90 days';
    if (days <= 120) return '91-120 days';
    return '120+ days';
  }

  get riskLevel(): 'Low' | 'Medium' | 'High' | 'Critical' {
    const days = this.daysPastDue;
    if (days <= 0) return 'Low';
    if (days <= 30) return 'Low';
    if (days <= 60) return 'Medium';
    if (days <= 90) return 'High';
    return 'Critical';
  }

  // Calculate interest on overdue amount
  calculateInterest(): number {
    if (!this.isOverdue || this.interestRate <= 0) return 0;
    
    const principal = this.remainingBalance;
    const dailyRate = this.interestRate / 365 / 100;
    const days = this.daysPastDue;
    
    return principal * dailyRate * days;
  }

  // Calculate late fees based on business rules
  calculateLateFee(): number {
    if (!this.isOverdue) return 0;
    
    // Example: $25 flat fee after 30 days, then $10 every additional 30 days
    const days = this.daysPastDue;
    if (days <= 30) return 0;
    
    const periodsLate = Math.ceil((days - 30) / 30);
    return 25 + (periodsLate * 10);
  }
}
