import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({description: 'page'})
  @IsNumber()
  @IsOptional()
  page: number;

  @ApiPropertyOptional({description: "limit"})
  @IsNumber()
  @IsOptional()
  limit: number;
}