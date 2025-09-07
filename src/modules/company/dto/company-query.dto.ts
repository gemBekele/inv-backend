import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Limit' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly limit?: number;

  @ApiPropertyOptional({ description: 'Page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly page?: number;
}
