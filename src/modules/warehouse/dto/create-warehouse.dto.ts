import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
	@ApiProperty({ description: 'Name of the warehouse' })
	@IsString()
	name: string;

	@ApiPropertyOptional({ description: 'Location of the warehouse' })
	@IsString()
	@IsOptional()
	location?: string;

	@ApiProperty({ description: 'Company ID that owns this warehouse' })
	@IsString()
	@IsUUID()
	companyId: string;

	@ApiPropertyOptional({ description: 'Description of the warehouse' })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({ description: 'Maximum capacity of the warehouse' })
	@IsOptional()
	capacity?: number;

	@ApiPropertyOptional({ description: 'Manager ID for this warehouse' })
	@IsString()
	@IsUUID()
	@IsOptional()
	managerId?: string;
}
