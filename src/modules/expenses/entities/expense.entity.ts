import { Entity, Column, ManyToOne, OneToMany, JoinColumn, BeforeInsert, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../company/entities/company.entity';
import { Branch } from '../../collections/entities/branch.entity';
import { ExpenseApproval } from './expense-approval.entity';
import { ExpenseAttachment } from './expense-attachment.entity';
import { 
  ExpenseStatus, 
  ExpenseType, 
  ExpenseCategory,
  ExpenseRecurrence,
  PaymentMethod 
} from '../enums/expense.enums';

@Entity('expenses')
@Index(['expenseNumber'], { unique: true })
@Index(['status'])
@Index(['expenseDate'])
@Index(['type'])
@Index(['category'])
export class Expense extends BaseEntity {
  @Column({ length: 50, unique: true })
  expenseNumber: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ExpenseType })
  type: ExpenseType;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status: ExpenseStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ length: 255, nullable: true })
  vendor?: string;

  @Column({ length: 100, nullable: true })
  receiptNumber?: string;

  @Column({ length: 100, nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'enum', enum: ExpenseRecurrence, default: ExpenseRecurrence.ONE_TIME })
  recurrence: ExpenseRecurrence;

  @Column({ type: 'boolean', default: false })
  isReimbursable: boolean;

  @Column({ type: 'boolean', default: false })
  isReimbursed: boolean;

  @Column({ type: 'date', nullable: true })
  reimbursedDate?: Date;

  @Column({ type: 'boolean', default: true })
  isTaxDeductible: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  approvedAmount: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ length: 100, nullable: true })
  costCenter?: string;

  @Column({ length: 100, nullable: true })
  project?: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'submitted_by' })
  submittedBy: User;

  @ManyToOne(() => Company, company => company.id)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch, branch => branch.id, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @OneToMany(() => ExpenseApproval, approval => approval.expense)
  approvals: ExpenseApproval[];

  @OneToMany(() => ExpenseAttachment, attachment => attachment.expense, { cascade: true })
  attachments: ExpenseAttachment[];

  @BeforeInsert()
  setDefaults() {
    if (!this.expenseDate) {
      this.expenseDate = new Date();
    }
    
    if (!this.expenseNumber) {
      this.generateExpenseNumber();
    }

    // Calculate total amount including tax
    if (this.taxRate > 0) {
      this.taxAmount = (this.amount * this.taxRate) / 100;
      this.totalAmount = this.amount + this.taxAmount;
    } else {
      this.totalAmount = this.amount;
    }
  }

  private generateExpenseNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.expenseNumber = `EXP-${timestamp}-${random}`;
  }

  // Computed properties
  get isPendingApproval(): boolean {
    return this.status === ExpenseStatus.PENDING_APPROVAL || 
           this.status === ExpenseStatus.SUBMITTED;
  }

  get isApproved(): boolean {
    return this.status === ExpenseStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this.status === ExpenseStatus.REJECTED;
  }

  get isPaid(): boolean {
    return this.status === ExpenseStatus.PAID;
  }

  get needsReimbursement(): boolean {
    return this.isReimbursable && !this.isReimbursed && this.isApproved;
  }

  get isOverdue(): boolean {
    if (!this.dueDate || this.isPaid) return false;
    return new Date() > this.dueDate;
  }

  get currentApprovalLevel(): string | null {
    const pendingApproval = this.approvals?.find(
      approval => approval.status === 'pending'
    );
    return pendingApproval?.approvalLevel || null;
  }

  get hasRequiredAttachments(): boolean {
    // Business rule: expenses over certain amount require receipts
    const RECEIPT_REQUIRED_AMOUNT = 50;
    if (this.amount > RECEIPT_REQUIRED_AMOUNT) {
      return this.attachments && this.attachments.length > 0;
    }
    return true;
  }
}
