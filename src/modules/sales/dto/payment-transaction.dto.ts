import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, TransactionType } from '../enums';

export class CreatePaymentTransactionDto {
  @ApiProperty({ description: 'Sale ID' })
  @IsString()
  saleId: string;

  @ApiProperty({ description: 'Amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentType })
  @IsEnum(PaymentType)
  paymentMethod: PaymentType;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Payment details (JSON)' })
  @IsOptional()
  paymentDetails?: Record<string, any>;

  @ApiProperty({ description: 'Processed by user ID' })
  @IsString()
  processedBy: string;
}

export class PaymentTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentType })
  paymentMethod: PaymentType;

  @ApiProperty({ enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty()
  transactionReference?: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  transactionDate: Date;

  @ApiProperty()
  paymentDetails?: Record<string, any>;

  @ApiProperty()
  isSuccessful: boolean;

  @ApiProperty()
  failureReason?: string;

  @ApiProperty()
  saleId: string;

  @ApiProperty()
  processedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
