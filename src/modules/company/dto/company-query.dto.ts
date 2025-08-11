import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CompanyQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Limit' })
  @IsOptional()
  @IsNumber()
  readonly limit?: number;

  @ApiPropertyOptional({ description: 'Page' })
  @IsOptional()
  @IsNumber()
  readonly page?: number;
}
