import { ProductResponseDto } from '@/modules/products/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseResponseDto {
	@ApiProperty({ description: 'Unique identifier of the warehouse' })
	id: string;

	@ApiProperty({ description: 'Name of the warehouse' })
	name: string;

	@ApiPropertyOptional({ description: 'Location of the warehouse' })
	location?: string;

	@ApiProperty({ description: 'Date when the warehouse was created', type: String, format: 'date-time' })
	createdAt: Date;

	@ApiProperty({ description: 'Date when the warehouse was last updated', type: String, format: 'date-time' })
	updatedAt: Date;
}

export class WarehouseDetailResponseDto extends WarehouseResponseDto {
	 @ApiProperty({ type: [ProductResponseDto] }) products: ProductResponseDto[];
}