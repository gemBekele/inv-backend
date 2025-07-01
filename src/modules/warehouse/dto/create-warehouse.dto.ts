import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
	@ApiProperty({ description: 'Name of the warehouse' })
	@IsString()
	name: string;

	@ApiPropertyOptional({ description: 'Location of the warehouse' })
	@IsString()
	@IsOptional()
	location?: string;
}