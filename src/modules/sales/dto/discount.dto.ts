import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../enums';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Discount description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Discount code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Discount type', enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  value: number;

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  maximumDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Usage limit' })
  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: Date;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Apply to all products', default: false })
  @IsBoolean()
  @IsOptional()
  applyToAllProducts?: boolean;

  @ApiPropertyOptional({ description: 'Apply to all customers', default: false })
  @IsBoolean()
  @IsOptional()
  applyToAllCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Applicable product IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable customer IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCustomerIds?: string[];
}

export class UpdateDiscountDto {
  @ApiPropertyOptional({ description: 'Discount name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Discount description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Discount code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountType })
  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({ description: 'Discount value (percentage or fixed amount)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  maximumDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Usage limit' })
  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Apply to all products' })
  @IsBoolean()
  @IsOptional()
  applyToAllProducts?: boolean;

  @ApiPropertyOptional({ description: 'Apply to all customers' })
  @IsBoolean()
  @IsOptional()
  applyToAllCustomers?: boolean;

  @ApiPropertyOptional({ description: 'Applicable product IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable customer IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCustomerIds?: string[];
}

export class DiscountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  code?: string;

  @ApiProperty({ enum: DiscountType })
  type: DiscountType;

  @ApiProperty()
  value: number;

  @ApiProperty()
  minimumOrderAmount?: number;

  @ApiProperty()
  maximumDiscountAmount?: number;

  @ApiProperty()
  usageLimit?: number;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  applyToAllProducts: boolean;

  @ApiProperty()
  applyToAllCustomers: boolean;

  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
