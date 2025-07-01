
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto';
import { ProductType, ProductStatus } from '../enums';

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Search by name, SKU, or barcode' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: ProductType,
    description: 'Filter by product type'
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ 
    description: 'Filter by category' 
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    enum: ProductStatus,
    description: 'Filter by status'
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ 
    description: 'Filter low stock products',
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  lowStock?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter expired products',
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  expired?: boolean;

  @ApiPropertyOptional({ 
    description: 'Minimum price filter' 
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum price filter' 
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;
}
