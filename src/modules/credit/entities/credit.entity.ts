import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Company } from '../../company/entities/company.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { CreditPayment } from './credit-payment.entity';
import { CreditTransaction } from './credit-transaction.entity';
import { CreditType, CreditStatus, CreditRating } from '../enums';

@Entity('credits')
@Index(['creditNumber'], { unique: true })
@Index(['companyId', 'type'])
@Index(['status'])
@Index(['dueDate'])
export class Credit extends BaseEntity {
  @Column({ length: 50, unique: true })
  creditNumber: string;

  @Column({ type: 'enum', enum: CreditType })
  type: CreditType;

  @Column({ type: 'enum', enum: CreditStatus, default: CreditStatus.PENDING })
  status: CreditStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  principalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interestAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  feesAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ type: 'enum', enum: CreditRating, default: CreditRating.NO_RATING })
  creditRating: CreditRating;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

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

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'date', nullable: true })
  approvedDate?: Date;

  // Relationships
  @ManyToOne(() => Company, company => company.credits)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Customer, customer => customer.credits, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

  @OneToMany(() => CreditPayment, payment => payment.credit)
  payments: CreditPayment[];

  @OneToMany(() => CreditTransaction, transaction => transaction.credit)
  transactions: CreditTransaction[];

  @BeforeInsert()
  setDefaults() {
    if (!this.creditNumber) {
      this.generateCreditNumber();
    }
    if (!this.issueDate) {
      this.issueDate = new Date();
    }
    if (!this.dueDate) {
      this.dueDate = new Date(this.issueDate);
      this.dueDate.setDate(this.dueDate.getDate() + this.paymentTermsDays);
    }
    if (!this.remainingBalance) {
      this.remainingBalance = this.principalAmount;
    }
  }

  private generateCreditNumber() {
    const prefix = this.type === CreditType.RECEIVABLE ? 'AR' : 
                   this.type === CreditType.PAYABLE ? 'AP' : 
                   this.type === CreditType.LOAN ? 'LN' : 'AD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.creditNumber = `${prefix}-${timestamp}-${random}`;
  }

  get totalAmount(): number {
    return Number(this.principalAmount) + Number(this.interestAmount) + Number(this.feesAmount);
  }

  get isOverdue(): boolean {
    return !this.isFullyPaid && new Date() > this.dueDate;
  }

  get isFullyPaid(): boolean {
    return this.status === CreditStatus.FULLY_PAID || this.remainingBalance <= 0;
  }

  get daysPastDue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get paymentPercentage(): number {
    if (this.totalAmount === 0) return 0;
    return (this.paidAmount / this.totalAmount) * 100;
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
}