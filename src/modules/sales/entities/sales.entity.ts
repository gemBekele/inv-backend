import { Entity, Column, ManyToOne, OneToMany, BeforeInsert, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { SaleItem } from './sales-item.entity';
import { Commission } from '../../commission/entities/commission.entity';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentType, SaleStatus, DiscountType, TransactionType } from '../enums';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shops.entity';
import { Branch } from '../../collections/entities/branch.entity';
import { Credit } from '../../credit/entities/credit.entity';

@Entity('sales')
export class Sales extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advancePayment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ type: 'date' })
  saleDate: Date;

  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ length: 255, nullable: true })
  note?: string;

  // Discount fields
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'enum', enum: DiscountType, nullable: true })
  discountType?: DiscountType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  // Subtotal before discount and tax
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Invoice number
  @Column({ length: 50, unique: true, nullable: true })
  invoiceNumber?: string;

  // Reference number for external systems
  @Column({ length: 100, nullable: true })
  referenceNumber?: string;

  // Due date for credit sales
  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  // Terms and conditions
  @Column({ type: 'text', nullable: true })
  terms?: string;

  @ManyToOne(() => Customer, customer => customer.id)
  customer: Customer;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id)
  warehouse: Warehouse;

  @ManyToOne(() => Shop, shop => shop.sales, { nullable: true })
  @JoinColumn({ name: 'shop_id' })
  shop?: Shop;

  @ManyToOne(() => Branch, branch => branch.sales, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => SaleItem, saleItem => saleItem.sales)
  items: SaleItem[];

  @OneToMany(() => Commission, commission => commission.sale)
  commissions: Commission[];

  @OneToMany(() => PaymentTransaction, transaction => transaction.sale)
  paymentTransactions: PaymentTransaction[];

  @OneToMany(() => Credit, credit => credit.metadata?.saleId ? credit : null)
  credits: Credit[];

  @BeforeInsert()
  setDefaultDate() {
    if (!this.saleDate) {
      this.saleDate = new Date();
    }
  }

  @BeforeInsert()
  generateInvoiceNumber() {
    if (!this.invoiceNumber) {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      this.invoiceNumber = `INV-${timestamp}-${random}`;
    }
  }

  // Calculate total paid amount
  get totalPaid(): number {
    if (!this.paymentTransactions) return this.advancePayment;
    return this.paymentTransactions
      .filter(t => t.isSuccessful && t.transactionType === 'sale')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  // Check if sale is fully paid
  get isFullyPaid(): boolean {
    return this.totalPaid >= this.totalAmount;
  }

  // Check if sale is overdue (for credit sales)
  get isOverdue(): boolean {
    if (!this.dueDate || this.isFullyPaid) return false;
    return new Date() > this.dueDate;
  }
}
