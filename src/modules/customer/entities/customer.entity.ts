import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { CustomerStatus } from '../enums/customer-status.enum';
import { BaseEntity } from '../../../database/entities';
import { CreditSales } from '../../sales/entities/credit-sales.entity';
import { Company } from '../../company/entities/company.entity';
import { Credit } from '../../credit/entities/credit.entity';
// import { CustomerStatus } from './enums/customer-status.enum';
// import { Order } from '../orders/entities/order.entity';
// import { Sale } from '../sales/entities/sale.entity';

export enum CreditRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  NO_RATING = 'no_rating'
}

@Entity('customers')
@Index(['phoneNumber', 'companyId'], { unique: true })
export class Customer extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 10 })
  phoneNumber: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Credit Management Fields
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentCreditBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  availableCredit: number;

  @Column({ type: 'enum', enum: CreditRating, default: CreditRating.NO_RATING })
  creditRating: CreditRating;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ type: 'boolean', default: false })
  isCreditApproved: boolean;

  @Column({ type: 'date', nullable: true })
  creditApprovedDate?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number; // Annual interest rate for overdue amounts

  @Column({ type: 'boolean', default: false })
  allowCreditSales: boolean;

  @Column({ type: 'text', nullable: true })
  creditNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  // @Column({ type: 'int', default: 0 })
  // loyaltyPoints: number;

  @OneToMany(() => CreditSales, creditSales => creditSales.customer)
  creditSales: CreditSales[];

  @OneToMany(() => Credit, credit => credit.customer)
  credits: Credit[];

  @ManyToOne(() => Company, company => company.customers, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  // @OneToMany(() => Order, order => order.customer)
  // orders: Order[];

  // @OneToMany(() => Sale, sale => sale.customer)
  // sales: Sale[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  normalizePhone() {
    if (this.phoneNumber) {
      this.phoneNumber = this.phoneNumber.replace(/\D/g, '').trim();
    }
  }

  // Credit Management Computed Properties
  get canCreateCreditSale(): boolean {
    return this.allowCreditSales && 
           this.isCreditApproved && 
           this.status === CustomerStatus.ACTIVE;
  }

  get creditUtilization(): number {
    if (this.creditLimit === 0) return 0;
    return (this.currentCreditBalance / this.creditLimit) * 100;
  }

  get isOverCreditLimit(): boolean {
    return this.currentCreditBalance > this.creditLimit;
  }

  get remainingCreditLimit(): number {
    return Math.max(0, this.creditLimit - this.currentCreditBalance);
  }

  get creditScore(): number {
    // Simple credit score calculation based on payment history and utilization
    // In a real system, this would be more sophisticated
    switch (this.creditRating) {
      case CreditRating.EXCELLENT: return 800;
      case CreditRating.GOOD: return 700;
      case CreditRating.FAIR: return 600;
      case CreditRating.POOR: return 500;
      default: return 0;
    }
  }

  get totalOverdueAmount(): number {
    if (!this.creditSales) return 0;
    return this.creditSales
      .filter(cs => cs.isOverdue)
      .reduce((sum, cs) => sum + cs.remainingBalance, 0);
  }

  get hasOverduePayments(): boolean {
    return this.totalOverdueAmount > 0;
  }
}
