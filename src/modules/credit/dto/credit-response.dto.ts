import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditType, CreditStatus, CreditRating, PaymentStatus, TransactionType } from '../enums';

export class CreditResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'AR-12345678-ABC' })
  creditNumber: string;

  @ApiProperty({ enum: CreditType })
  type: CreditType;

  @ApiProperty({ enum: CreditStatus })
  status: CreditStatus;

  @ApiProperty({ example: 5000.00 })
  principalAmount: number;

  @ApiProperty({ example: 125.50 })
  interestAmount: number;

  @ApiProperty({ example: 25.00 })
  feesAmount: number;

  @ApiProperty({ example: 5150.50 })
  totalAmount: number;

  @ApiProperty({ example: 2000.00 })
  paidAmount: number;

  @ApiProperty({ example: 3150.50 })
  remainingBalance: number;

  @ApiProperty({ example: 12.5 })
  interestRate: number;

  @ApiProperty({ example: '2024-01-15' })
  issueDate: string;

  @ApiProperty({ example: '2024-02-14' })
  dueDate: string;

  @ApiProperty({ example: 30 })
  paymentTermsDays: number;

  @ApiProperty({ enum: CreditRating })
  creditRating: CreditRating;

  @ApiPropertyOptional({ example: 'Invoice payment for services' })
  description?: string;

  @ApiPropertyOptional({ example: 'Payment due within 30 days' })
  terms?: string;

  @ApiPropertyOptional({ example: 'Customer has good payment history' })
  notes?: string;

  @ApiProperty({ example: false })
  isDisputed: boolean;

  @ApiPropertyOptional({ example: 'Disputed invoice amount' })
  disputeReason?: string;

  @ApiProperty({ example: false })
  isOverdue: boolean;

  @ApiProperty({ example: 5 })
  daysPastDue: number;

  @ApiProperty({ example: 38.8 })
  paymentPercentage: number;

  @ApiProperty({ example: 'Current' })
  agingCategory: string;

  @ApiProperty({ example: 'Low' })
  riskLevel: string;

  @ApiPropertyOptional({ example: { saleId: '123e4567-e89b-12d3-a456-426614174000', invoiceNumber: 'INV-123456' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiPropertyOptional()
  customer?: {
    id: string;
    name: string;
    phoneNumber: string;
  };

  @ApiPropertyOptional()
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  @ApiPropertyOptional()
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class CreditPaymentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'PAY-12345678-AB' })
  paymentNumber: string;

  @ApiProperty({ example: 1000.00 })
  amount: number;

  @ApiProperty({ example: 950.00 })
  principalAmount: number;

  @ApiProperty({ example: 50.00 })
  interestAmount: number;

  @ApiProperty({ example: 0.00 })
  feesAmount: number;

  @ApiProperty({ example: '2024-01-20' })
  paymentDate: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: 'bank_transfer' })
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TXN123456789' })
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'Partial payment received' })
  notes?: string;

  @ApiProperty({ example: '2024-01-20T14:30:00Z' })
  createdAt: string;

  @ApiPropertyOptional()
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class CreditTransactionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'TXN-12345678-AB' })
  transactionNumber: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: 1000.00 })
  amount: number;

  @ApiProperty({ example: 4150.50 })
  balanceAfter: number;

  @ApiProperty({ example: '2024-01-20' })
  transactionDate: string;

  @ApiPropertyOptional({ example: 'Payment received via bank transfer' })
  description?: string;

  @ApiPropertyOptional({ example: 'PAY-12345678-AB' })
  referenceId?: string;

  @ApiProperty({ example: '2024-01-20T14:30:00Z' })
  createdAt: string;

  @ApiPropertyOptional()
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class CreditStatsResponseDto {
  @ApiProperty({ example: 150 })
  totalCredits: number;

  @ApiProperty({ example: 125000.00 })
  totalPrincipalAmount: number;

  @ApiProperty({ example: 45000.00 })
  totalPaidAmount: number;

  @ApiProperty({ example: 80000.00 })
  totalRemainingBalance: number;

  @ApiProperty({ example: 25 })
  overdueCredits: number;

  @ApiProperty({ example: 15000.00 })
  totalOverdueAmount: number;

  @ApiProperty({ example: 36.0 })
  averagePaymentPercentage: number;

  @ApiProperty()
  creditsByType: {
    receivable: number;
    payable: number;
    loan: number;
    advance: number;
  };

  @ApiProperty()
  creditsByStatus: {
    pending: number;
    approved: number;
    active: number;
    partially_paid: number;
    fully_paid: number;
    overdue: number;
    written_off: number;
    cancelled: number;
  };

  @ApiProperty()
  agingAnalysis: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    days120plus: number;
  };
}