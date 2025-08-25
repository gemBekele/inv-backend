import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Expense } from './expense.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseApprovalLevel } from '../enums/expense.enums';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped'
}

@Entity('expense_approvals')
@Index(['status'])
@Index(['approvalLevel'])
export class ExpenseApproval extends BaseEntity {
  @Column({ type: 'enum', enum: ExpenseApprovalLevel })
  approvalLevel: ExpenseApprovalLevel;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount?: number;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'date', nullable: true })
  approvedDate?: Date;

  @Column({ type: 'int', default: 1 })
  sequence: number; // Order of approval

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minimumAmount?: number; // Minimum amount that requires this approval level

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maximumAmount?: number; // Maximum amount this level can approve

  // Relationships
  @ManyToOne(() => Expense, expense => expense.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver?: User;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo?: User; // User who should approve this

  @BeforeInsert()
  setDefaults() {
    if (!this.approvedDate && this.status === ApprovalStatus.APPROVED) {
      this.approvedDate = new Date();
    }
  }

  // Computed properties
  get isPending(): boolean {
    return this.status === ApprovalStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === ApprovalStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this.status === ApprovalStatus.REJECTED;
  }

  get canApprove(): boolean {
    return this.status === ApprovalStatus.PENDING;
  }

  get isWithinApprovalLimit(): boolean {
    if (!this.maximumAmount || !this.expense) return true;
    return this.expense.amount <= this.maximumAmount;
  }
}
