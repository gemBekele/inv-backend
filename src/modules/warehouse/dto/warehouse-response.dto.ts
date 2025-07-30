import { ProductResponseDto } from '@/modules/products/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseResponseDto {
	@ApiProperty({ description: 'Unique identifier of the warehouse' })
	id: string;

	@ApiProperty({ description: 'Name of the warehouse' })
	name: string;

	@ApiPropertyOptional({ description: 'Location of the warehouse' })
	location?: string;

	@ApiPropertyOptional({ description: 'Description of the warehouse' })
	description?: string;

	@ApiPropertyOptional({ description: 'Maximum capacity of the warehouse' })
	capacity?: number;

	@ApiPropertyOptional({ description: 'Company name that owns this warehouse' })
	companyName?: string;

	@ApiPropertyOptional({ description: 'Manager name of this warehouse' })
	managerName?: string;

	@ApiProperty({ description: 'Date when the warehouse was created', type: String, format: 'date-time' })
	createdAt: Date;

	@ApiProperty({ description: 'Date when the warehouse was last updated', type: String, format: 'date-time' })
	updatedAt: Date;
}

export class WarehouseDetailResponseDto extends WarehouseResponseDto {
	 @ApiProperty({ type: [ProductResponseDto] }) products: ProductResponseDto[];
}