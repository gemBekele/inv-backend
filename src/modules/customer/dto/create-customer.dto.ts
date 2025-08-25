import { IsString, IsOptional, IsEnum, IsInt, Min, IsNumber, IsNotEmpty, Matches, IsBoolean, IsDate, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CreditRating } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Customer phone number of 10 digits, starting with 09 or 07',
  })
  @IsString()
  @IsNotEmpty()
  // Regex: starts with 09 or 07, followed by 8 digits
  @Matches(/^(09|07)\d{8}$/, {
    message: 'Phone number must start with 09 or 07 and be 10 digits long',
  })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  // Credit Management Fields
  @ApiPropertyOptional({ description: 'Credit limit for the customer', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Current credit balance', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentCreditBalance?: number;

  @ApiPropertyOptional({ 
    description: 'Credit rating of the customer',
    enum: CreditRating,
    default: CreditRating.NO_RATING
  })
  @IsEnum(CreditRating)
  @IsOptional()
  creditRating?: CreditRating;

  @ApiPropertyOptional({ description: 'Payment terms in days', default: 30 })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Whether credit is approved', default: false })
  @IsBoolean()
  @IsOptional()
  isCreditApproved?: boolean;

  @ApiPropertyOptional({ description: 'Date when credit was approved' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  creditApprovedDate?: Date;

  @ApiPropertyOptional({ description: 'Annual interest rate for overdue amounts', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Allow credit sales for this customer', default: false })
  @IsBoolean()
  @IsOptional()
  allowCreditSales?: boolean;

  @ApiPropertyOptional({ description: 'Credit-related notes' })
  @IsString()
  @IsOptional()
  creditNotes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}


