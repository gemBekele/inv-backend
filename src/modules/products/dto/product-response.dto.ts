
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '../enums';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sku: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  cost: number;

  @ApiPropertyOptional()
  expiryDate?: Date;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  trackStock: boolean;

  @ApiProperty()
  profitMargin: number;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
