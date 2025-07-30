import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Sales } from './sales.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentType, TransactionType } from '../enums';

@Entity('payment_transactions')
export class PaymentTransaction extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentType })
  paymentMethod: PaymentType;

  @Column({ type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({ length: 100, nullable: true })
  transactionReference?: string;

  @Column({ length: 255, nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ type: 'json', nullable: true })
  paymentDetails?: Record<string, any>; // Store gateway response, card details, etc.

  @Column({ type: 'boolean', default: true })
  isSuccessful: boolean;

  @Column({ length: 255, nullable: true })
  failureReason?: string;

  @ManyToOne(() => Sales, sale => sale.id)
  @JoinColumn({ name: 'sale_id' })
  sale: Sales;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;
}
