import { ApiProperty } from "@nestjs/swagger";

export class CustomerResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Customer name' })
  name: string;

  @ApiProperty({ description: 'Customer phone number' })
  phoneNumber: string;

  @ApiProperty({ description: 'Customer address', required: false })
  address?: string;

  @ApiProperty({ description: 'Customer status' })
  status: string;

  // @ApiProperty({ description: 'Loyalty points' })
  // loyaltyPoints: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}