import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { PaymentStatus } from '../enums';

export class CreateCreditPaymentDto {
  @ApiProperty({ 
    description: 'Payment amount',
    example: 1000.00,
    minimum: 0.01
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'Payment method',
    example: 'bank_transfer'
  })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ 
    description: 'Payment date (defaults to current date)',
    example: '2024-01-15'
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ 
    description: 'Transaction reference',
    example: 'TXN123456789'
  })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ 
    description: 'Payment notes',
    example: 'Partial payment received via bank transfer'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { bankName: 'ABC Bank', checkNumber: '12345' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCreditPaymentDto {
  @ApiPropertyOptional({ 
    description: 'Payment status',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}