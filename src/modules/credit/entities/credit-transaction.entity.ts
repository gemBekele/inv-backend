import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Credit } from './credit.entity';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from '../enums';

@Entity('credit_transactions')
@Index(['transactionNumber'], { unique: true })
@Index(['creditId'])
@Index(['transactionDate'])
@Index(['type'])
export class CreditTransaction extends BaseEntity {
  @Column({ length: 50, unique: true })
  transactionNumber: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  referenceId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid' })
  creditId: string;

  @Column({ type: 'uuid' })
  processedById: string;

  // Relationships
  @ManyToOne(() => Credit, credit => credit.transactions)
  @JoinColumn({ name: 'creditId' })
  credit: Credit;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @BeforeInsert()
  setDefaults() {
    if (!this.transactionNumber) {
      this.generateTransactionNumber();
    }
    if (!this.transactionDate) {
      this.transactionDate = new Date();
    }
  }

  private generateTransactionNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    this.transactionNumber = `TXN-${timestamp}-${random}`;
  }
}