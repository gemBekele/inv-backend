import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CreditRating } from '../entities/customer.entity';

export class CustomerResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Customer name' })
  name: string;

  @ApiProperty({ description: 'Customer phone number' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  address?: string;

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus })
  status: CustomerStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  // Credit Management Fields
  @ApiProperty({ description: 'Credit limit for the customer' })
  creditLimit: number;

  @ApiProperty({ description: 'Current credit balance' })
  currentCreditBalance: number;

  @ApiProperty({ description: 'Available credit' })
  availableCredit: number;

  @ApiProperty({ description: 'Credit rating', enum: CreditRating })
  creditRating: CreditRating;

  @ApiProperty({ description: 'Payment terms in days' })
  paymentTermsDays: number;

  @ApiProperty({ description: 'Whether credit is approved' })
  isCreditApproved: boolean;

  @ApiPropertyOptional({ description: 'Date when credit was approved' })
  creditApprovedDate?: Date;

  @ApiProperty({ description: 'Annual interest rate for overdue amounts' })
  interestRate: number;

  @ApiProperty({ description: 'Allow credit sales for this customer' })
  allowCreditSales: boolean;

  @ApiPropertyOptional({ description: 'Credit-related notes' })
  creditNotes?: string;

  // Computed Properties
  @ApiProperty({ description: 'Whether customer can create credit sales' })
  canCreateCreditSale: boolean;

  @ApiProperty({ description: 'Credit utilization percentage' })
  creditUtilization: number;

  @ApiProperty({ description: 'Whether customer is over credit limit' })
  isOverCreditLimit: boolean;

  @ApiProperty({ description: 'Remaining credit limit' })
  remainingCreditLimit: number;

  @ApiProperty({ description: 'Credit score based on rating' })
  creditScore: number;

  @ApiProperty({ description: 'Total overdue amount' })
  totalOverdueAmount: number;

  @ApiProperty({ description: 'Whether customer has overdue payments' })
  hasOverduePayments: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}
