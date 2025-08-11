import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUUID, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateProductGroupDto {
  @ApiProperty({ description: 'Group name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Group code', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ description: 'Is group active', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Default commission rate for products in this group', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultCommissionRate?: number;

  @ApiPropertyOptional({ description: 'Default tax rate for products in this group', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultTaxRate?: number;

  @ApiPropertyOptional({ description: 'Array of product IDs to add to this group', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}

export class UpdateProductGroupDto {
  @ApiPropertyOptional({ description: 'Group name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Group code', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ description: 'Is group active' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Default commission rate for products in this group' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultCommissionRate?: number;

  @ApiPropertyOptional({ description: 'Default tax rate for products in this group' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultTaxRate?: number;
}

export class AddProductsToGroupDto {
  @ApiProperty({ description: 'Array of product IDs to add to the group', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];
}

export class RemoveProductsFromGroupDto {
  @ApiProperty({ description: 'Array of product IDs to remove from the group', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];
}

export class ProductGroupQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class ProductGroupResponseDto {
  @ApiProperty({ description: 'Group ID' })
  id: string;

  @ApiProperty({ description: 'Group name' })
  name: string;

  @ApiPropertyOptional({ description: 'Group description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Group code' })
  code?: string;

  @ApiProperty({ description: 'Is group active' })
  isActive: boolean;

  @ApiProperty({ description: 'Default commission rate' })
  defaultCommissionRate: number;

  @ApiProperty({ description: 'Default tax rate' })
  defaultTaxRate: number;

  @ApiPropertyOptional({ description: 'Number of products in group' })
  productCount?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
