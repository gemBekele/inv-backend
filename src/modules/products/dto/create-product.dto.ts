import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsDateString,
  Min,
  Max,
  Length,
  IsUrl,
  IsObject
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductType, ProductStatus } from '../enums';

export class CreateProductDto {
  @ApiProperty({ 
    enum: ProductType, 
    description: 'Type of product (product or service)' 
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ 
    description: 'Product name',
    example: 'iPhone 15 Pro'
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ 
    description: 'Product description',
    example: 'Latest iPhone with advanced camera features'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Stock Keeping Unit (auto-generated if not provided)',
    example: 'PRD-ABC123'
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sku?: string;

  @ApiPropertyOptional({ 
    description: 'Product barcode (auto-generated for products if not provided)',
    example: '1234567890123'
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  barcode?: string;

  @ApiProperty({ 
    description: 'Product category',
    example: 'Electronics'
  })
  @IsString()
  @Length(1, 100)
  category: string;

  @ApiProperty({ 
    description: 'Unit of measurement',
    example: 'piece'
  })
  @IsString()
  @Length(1, 50)
  unit: string;

  @ApiProperty({ 
    description: 'Selling price',
    example: 999.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ 
    description: 'Cost price',
    example: 750.00
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost?: number;

  @ApiPropertyOptional({ 
    description: 'Current stock quantity',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @ApiPropertyOptional({ 
    description: 'Minimum stock level for alerts',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStockLevel?: number;

  @ApiPropertyOptional({ 
    description: 'Product expiry date (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ 
    enum: ProductStatus,
    description: 'Product status',
    default: ProductStatus.AVAILABLE
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ 
    description: 'Additional metadata as JSON object',
    example: { brand: 'Apple', model: '2023' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Product image URL',
    example: 'https://example.com/image.jpg'
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Tax rate percentage',
    example: 7.5,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  taxRate?: number;

  @ApiPropertyOptional({ 
    description: 'Whether to track stock for this product',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  trackStock?: boolean;
}
