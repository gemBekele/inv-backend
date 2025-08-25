import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsDate,
  IsUUID,
  Min,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ExpenseStatus, 
  ExpenseType, 
  ExpenseCategory,
  PaymentMethod 
} from '../enums/expense.enums';
import { ExpenseApprovalLevel } from '../enums';

export class ExpenseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Filter by payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by submitted user ID' })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Search by expense number' })
  @IsOptional()
  @IsString()
  expenseNumber?: string;

  @ApiPropertyOptional({ description: 'Search by vendor name' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (expense date)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date (expense date)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by due date start' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateStart?: Date;

  @ApiPropertyOptional({ description: 'Filter by due date end' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateEnd?: Date;

  @ApiPropertyOptional({ description: 'Filter reimbursable expenses only' })
  @IsOptional()
  @IsBoolean()
  isReimbursable?: boolean;

  @ApiPropertyOptional({ description: 'Filter overdue expenses only' })
  @IsOptional()
  @IsBoolean()
  isOverdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter by cost center' })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Filter by project' })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Search term (expense number, title, vendor, etc.)' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ExpenseApprovalDto {
  @ApiProperty({ description: 'Approval level', enum: ExpenseApprovalLevel })
  @IsEnum(ExpenseApprovalLevel)
  approvalLevel: ExpenseApprovalLevel;

  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'Approved amount (if different from requested)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;
}

export class ExpenseRejectionDto {
  @ApiProperty({ description: 'Approval level', enum: ExpenseApprovalLevel })
  @IsEnum(ExpenseApprovalLevel)
  approvalLevel: ExpenseApprovalLevel;

  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  rejectionReason: string;
}

export class AddExpenseAttachmentDto {
  @ApiProperty({ description: 'Attachment file name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File path or URL' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Attachment description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ExpenseDashboardStatsFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by date range start' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by date range end' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by submitted user ID' })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by cost center' })
  @IsOptional()
  @IsString()
  costCenter?: string;
}
