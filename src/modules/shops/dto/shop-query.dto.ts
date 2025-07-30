import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ShopQueryDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  page?: number;
  
  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  limit?: number;
  
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

}