import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  readonly limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}