import { ApiProperty } from "@nestjs/swagger";

export class CommissionResponseDto {
	@ApiProperty({ description: 'Unique identifier' })
	id: string;

	@ApiProperty({ description: 'Commission amount' })
	amount: number;

	@ApiProperty({ description: 'Commission date' })
	commissionDate: Date;

	@ApiProperty({ description: 'Commission rate' })
	commissionRate: number;

	@ApiProperty({ description: 'Commission amount' })
	commissionAmount: number;

	@ApiProperty({ description: 'Employee ID' })
	employeeId: string;

	@ApiProperty({ description: 'Product ID' })
	productId: string;

	@ApiProperty({ description: 'Sale ID' })
	saleId: string;
}
