import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditType, CreditRating } from '../enums';

export class CreateCreditDto {
  @ApiProperty({ 
    description: 'Type of credit',
    enum: CreditType,
    example: CreditType.RECEIVABLE
  })
  @IsEnum(CreditType)
  type: CreditType;

  @ApiProperty({ 
    description: 'Principal amount',
    example: 5000.00,
    minimum: 0.01
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  principalAmount: number;

  @ApiProperty({ 
    description: 'Annual interest rate percentage',
    example: 12.5,
    minimum: 0,
    maximum: 100
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ 
    description: 'Payment terms in days',
    example: 30,
    minimum: 1,
    maximum: 365
  })
  @IsNumber()
  @Min(1)
  @Max(365)
  paymentTermsDays: number;

  @ApiPropertyOptional({ 
    description: 'Customer ID for receivables',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Credit rating',
    enum: CreditRating,
    example: CreditRating.GOOD
  })
  @IsOptional()
  @IsEnum(CreditRating)
  creditRating?: CreditRating;

  @ApiPropertyOptional({ 
    description: 'Credit description',
    example: 'Invoice payment for services rendered'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Terms and conditions',
    example: 'Payment due within 30 days of invoice date'
  })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes',
    example: 'Customer has good payment history'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Issue date (defaults to current date)',
    example: '2024-01-15'
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ 
    description: 'Due date (calculated from issue date + payment terms if not provided)',
    example: '2024-02-14'
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { invoiceNumber: 'INV-001', department: 'Sales' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}