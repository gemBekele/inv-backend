import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, IsDecimal, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, SaleStatus, DiscountType } from '../enums';

export class CreateSaleItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit price override' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Notes for this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Shop ID' })
  @IsString()
  @IsUUID()
  @IsOptional()
  shopId?: string;

  @ApiProperty({ description: 'Sale items', type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ description: 'Payment type' })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiPropertyOptional({ description: 'Sale date' })
  @IsDateString()
  @IsOptional()
  saleDate?: Date;

  @ApiPropertyOptional({ description: 'Due date for credit sales' })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Note' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Advance payment amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  advancePayment?: number;

  @ApiPropertyOptional({ description: 'Overall discount type' })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Overall discount rate (percentage)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  discountRate?: number;

  @ApiProperty({ description: 'Created by user ID' })
  @IsString()
  @IsUUID()
  createdBy: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsUUID()
  @IsOptional()
  companyId?: string;
}
