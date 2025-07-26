import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, SaleStatus } from '../enums';

export class CreateSaleDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  warehouseId: string;

  @ApiProperty({ description: 'Sale items' })
  @IsString({ each: true })
  items: string[]; // Array of SaleItem IDs or product IDs with quantities

  @ApiProperty({ description: 'Payment type' })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiPropertyOptional({ description: 'Sale date' })
  @IsDateString()
  @IsOptional()
  saleDate?: Date;

  @ApiPropertyOptional({ description: 'Note' })
  @IsString()
  @IsOptional()
  note?: string;
}