import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsBoolean, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditRating } from '../entities/customer.entity';

export class UpdateCreditLimitDto {
  @ApiProperty({ description: 'New credit limit', minimum: 0 })
  @IsNumber()
  @Min(0)
  creditLimit: number;

  @ApiPropertyOptional({ description: 'Reason for credit limit update' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ApproveCreditDto {
  @ApiProperty({ description: 'Approved credit limit', minimum: 0 })
  @IsNumber()
  @Min(0)
  creditLimit: number;

  @ApiProperty({ 
    description: 'Credit rating for the customer',
    enum: CreditRating
  })
  @IsEnum(CreditRating)
  creditRating: CreditRating;

  @ApiProperty({ description: 'Payment terms in days', minimum: 1, maximum: 365 })
  @IsNumber()
  @Min(1)
  @Max(365)
  paymentTermsDays: number;

  @ApiProperty({ description: 'Annual interest rate for overdue amounts', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiPropertyOptional({ description: 'Credit approval notes' })
  @IsString()
  @IsOptional()
  creditNotes?: string;
}

export class UpdateCreditRatingDto {
  @ApiProperty({ 
    description: 'New credit rating',
    enum: CreditRating
  })
  @IsEnum(CreditRating)
  creditRating: CreditRating;

  @ApiPropertyOptional({ description: 'Reason for rating change' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateCreditBalanceDto {
  @ApiProperty({ description: 'New credit balance', minimum: 0 })
  @IsNumber()
  @Min(0)
  currentCreditBalance: number;

  @ApiPropertyOptional({ description: 'Reason for balance update' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ToggleCreditSalesDto {
  @ApiProperty({ description: 'Allow or disallow credit sales' })
  @IsBoolean()
  allowCreditSales: boolean;

  @ApiPropertyOptional({ description: 'Reason for toggle' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreditStatsResponseDto {
  @ApiProperty({ description: 'Total customers with credit' })
  totalCreditCustomers: number;

  @ApiProperty({ description: 'Total approved credit customers' })
  approvedCreditCustomers: number;

  @ApiProperty({ description: 'Total credit limit across all customers' })
  totalCreditLimit: number;

  @ApiProperty({ description: 'Total credit balance in use' })
  totalCreditBalance: number;

  @ApiProperty({ description: 'Total available credit' })
  totalAvailableCredit: number;

  @ApiProperty({ description: 'Customers over credit limit' })
  customersOverLimit: number;

  @ApiProperty({ description: 'Customers with overdue payments' })
  customersWithOverdue: number;

  @ApiProperty({ description: 'Total overdue amount across all customers' })
  totalOverdueAmount: number;

  @ApiProperty({ description: 'Average credit utilization percentage' })
  averageCreditUtilization: number;
}

export class CustomerCreditHistoryDto {
  @ApiProperty({ description: 'Transaction date' })
  date: Date;

  @ApiProperty({ description: 'Transaction type' })
  type: 'CREDIT_SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'INTEREST';

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Balance after transaction' })
  balance: number;

  @ApiPropertyOptional({ description: 'Transaction description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Reference ID (sale ID, payment ID, etc.)' })
  referenceId?: string;
}
