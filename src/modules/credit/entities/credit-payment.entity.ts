import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Credit } from './credit.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentStatus } from '../enums';

@Entity('credit_payments')
@Index(['paymentNumber'], { unique: true })
@Index(['creditId'])
@Index(['paymentDate'])
export class CreditPayment extends BaseEntity {
  @Column({ length: 50, unique: true })
  paymentNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  principalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interestAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  feesAmount: number;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ length: 50 })
  paymentMethod: string;

  @Column({ length: 100, nullable: true })
  transactionReference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid' })
  creditId: string;

  @Column({ type: 'uuid' })
  processedById: string;

  // Relationships
  @ManyToOne(() => Credit, credit => credit.payments)
  @JoinColumn({ name: 'creditId' })
  credit: Credit;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @BeforeInsert()
  setDefaults() {
    if (!this.paymentNumber) {
      this.generatePaymentNumber();
    }
    if (!this.paymentDate) {
      this.paymentDate = new Date();
    }
  }

  private generatePaymentNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    this.paymentNumber = `PAY-${timestamp}-${random}`;
  }
}