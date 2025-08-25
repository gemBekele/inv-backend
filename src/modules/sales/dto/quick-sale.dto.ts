import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickSaleItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;
}

export class QuickSaleDto {
  @ApiProperty({ description: 'Customer phone number', example: '+251911234567' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Sale items', type: [QuickSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickSaleItemDto)
  items: QuickSaleItemDto[];

  @ApiProperty({ description: 'Payment method', example: 'cash' })
  @IsString()
  paymentType: string;

  @ApiPropertyOptional({ description: 'Optional sale note' })
  @IsString()
  @IsOptional()
  note?: string;
}