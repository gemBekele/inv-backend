import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class commisionQueryDto {
	@ApiPropertyOptional({ description: 'Search term' })
	@IsString()
	@IsOptional()
	search?: string;

	@ApiPropertyOptional({ description: 'Employee ID' })
	@IsOptional()
	@IsString()
	readonly employeeId?: string;

	@ApiPropertyOptional({ description: 'Product ID' })
	@IsOptional()
	@IsString()
	readonly productId?: string;

	@ApiPropertyOptional({ description: 'Sale ID' })
	@IsOptional()
	@IsString()
	readonly saleId?: string;

	@ApiPropertyOptional({ description: 'Limit' })
	@IsOptional()
	@IsNumber()
	readonly limit?: number;

	@ApiPropertyOptional({ description: 'Page' })
	@IsOptional()
	@IsNumber()
	readonly page?: number;

}