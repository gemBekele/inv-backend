import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmployeeQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({description: 'page'})
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number;

  @ApiPropertyOptional({description: "limit"})
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit: number;
}