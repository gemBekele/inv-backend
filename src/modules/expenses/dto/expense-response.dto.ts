import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  ExpenseStatus, 
  ExpenseType, 
  ExpenseCategory,
  ExpenseRecurrence,
  PaymentMethod 
} from '../enums/expense.enums';

export class ExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  expenseNumber: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ExpenseType })
  type: ExpenseType;

  @ApiProperty({ enum: ExpenseCategory })
  category: ExpenseCategory;

  @ApiProperty({ enum: ExpenseStatus })
  status: ExpenseStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  expenseDate: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  vendor?: string;

  @ApiPropertyOptional()
  receiptNumber?: string;

  @ApiPropertyOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ enum: ExpenseRecurrence })
  recurrence: ExpenseRecurrence;

  @ApiProperty()
  isReimbursable: boolean;

  @ApiProperty()
  isReimbursed: boolean;

  @ApiPropertyOptional()
  reimbursedDate?: Date;

  @ApiProperty()
  isTaxDeductible: boolean;

  @ApiProperty()
  approvedAmount: number;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  costCenter?: string;

  @ApiPropertyOptional()
  project?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiProperty()
  isPendingApproval: boolean;

  @ApiProperty()
  isApproved: boolean;

  @ApiProperty()
  isRejected: boolean;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  needsReimbursement: boolean;

  @ApiProperty()
  isOverdue: boolean;

  @ApiPropertyOptional()
  currentApprovalLevel?: string;

  @ApiProperty()
  hasRequiredAttachments: boolean;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  submittedBy: any; // User details

  @ApiProperty()
  company: any; // Company details

  @ApiPropertyOptional()
  branch?: any; // Branch details

  @ApiProperty()
  approvals: any[]; // Approval details

  @ApiProperty()
  attachments: any[]; // Attachment details

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
