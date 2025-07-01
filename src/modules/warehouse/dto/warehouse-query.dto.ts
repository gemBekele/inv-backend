import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseQueryDto {
	@ApiPropertyOptional({ type: Number, minimum: 1, default: 1, description: 'Page number' })
	@IsInt()
	@Min(1)
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	page?: number = 1;

	@ApiPropertyOptional({ type: Number, minimum: 1, default: 10, description: 'Items per page' })
	@IsInt()
	@Min(1)
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number = 10;

	@ApiPropertyOptional({ type: String, description: 'Search term' })
	@IsString()
	@IsOptional()
	search?: string;
}