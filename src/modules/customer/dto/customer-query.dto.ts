import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CreditRating } from '../entities/customer.entity';

export class CustomerQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term for name or phone number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by customer status', enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Filter by credit rating', enum: CreditRating })
  @IsEnum(CreditRating)
  @IsOptional()
  creditRating?: CreditRating;

  @ApiPropertyOptional({ description: 'Filter by credit approval status' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isCreditApproved?: boolean;

  @ApiPropertyOptional({ description: 'Filter customers who can make credit sales' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  allowCreditSales?: boolean;

  @ApiPropertyOptional({ description: 'Filter customers over credit limit' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isOverCreditLimit?: boolean;

  @ApiPropertyOptional({ description: 'Filter customers with overdue payments' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  hasOverduePayments?: boolean;
}

