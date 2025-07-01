import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachProductDto {
	@ApiProperty({ type: String, format: 'uuid', description: 'UUID of the product to attach' })
	@IsUUID()
	productId: string;

	@ApiProperty({ type: Number, description: 'Quantity of stock to attach' })
	@IsNumber()
	@IsNotEmpty()
	stockQuantity: number;

	@ApiProperty({ type: Number, description: 'Minimum stock level for the product' })
	@IsNumber()
	@IsNotEmpty()
	minStockLevel: number;
}