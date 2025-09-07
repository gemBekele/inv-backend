import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { CreditStatus, CreditRating } from '../enums';

export class UpdateCreditDto {
  @ApiPropertyOptional({ 
    description: 'Credit status',
    enum: CreditStatus
  })
  @IsOptional()
  @IsEnum(CreditStatus)
  status?: CreditStatus;

  @ApiPropertyOptional({ 
    description: 'Interest rate percentage',
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  interestRate?: number;

  @ApiPropertyOptional({ 
    description: 'Payment terms in days',
    minimum: 1,
    maximum: 365
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  paymentTermsDays?: number;

  @ApiPropertyOptional({ 
    description: 'Credit rating',
    enum: CreditRating
  })
  @IsOptional()
  @IsEnum(CreditRating)
  creditRating?: CreditRating;

  @ApiPropertyOptional({ description: 'Credit description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Dispute status' })
  @IsOptional()
  @IsBoolean()
  isDisputed?: boolean;

  @ApiPropertyOptional({ description: 'Dispute reason' })
  @IsOptional()
  @IsString()
  disputeReason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}