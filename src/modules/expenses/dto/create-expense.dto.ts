import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsEnum, 
  IsBoolean,
  Min,
  Max,
  IsUUID,
  IsObject,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ExpenseType, 
  ExpenseCategory,
  ExpenseRecurrence,
  PaymentMethod 
} from '../enums/expense.enums';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Expense title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Expense description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Expense type',
    enum: ExpenseType
  })
  @IsEnum(ExpenseType)
  type: ExpenseType;

  @ApiProperty({ 
    description: 'Expense category',
    enum: ExpenseCategory
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ description: 'Expense amount (before tax)' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Tax rate (0-100)', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @ApiProperty({ description: 'Expense date' })
  @Type(() => Date)
  @IsDate()
  expenseDate: Date;

  @ApiPropertyOptional({ description: 'Due date for payment' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiProperty({ 
    description: 'Payment method used',
    enum: PaymentMethod
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Vendor/supplier name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor?: string;

  @ApiPropertyOptional({ description: 'Receipt number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Expense recurrence',
    enum: ExpenseRecurrence,
    default: ExpenseRecurrence.ONE_TIME
  })
  @IsEnum(ExpenseRecurrence)
  recurrence: ExpenseRecurrence;

  @ApiProperty({ description: 'Is this expense reimbursable?', default: false })
  @IsBoolean()
  isReimbursable: boolean;

  @ApiProperty({ description: 'Is this expense tax deductible?', default: true })
  @IsBoolean()
  isTaxDeductible: boolean;

  @ApiPropertyOptional({ description: 'Cost center code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Project code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  project?: string;

  @ApiPropertyOptional({ description: 'Department code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
