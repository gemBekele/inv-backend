import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class AttachProductDto {
  @ApiProperty({ description: 'Product ID to attach' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Initial stock quantity', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number = 0;

  @ApiPropertyOptional({ description: 'Minimum stock level', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStockLevel?: number = 0;
}