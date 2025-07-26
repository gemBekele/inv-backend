import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '../enums';

export class SaleQueryDto {
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

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

 
}