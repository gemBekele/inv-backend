import { ApiProperty } from "@nestjs/swagger";

export class CompanyResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  name: string;

  @ApiProperty({ description: 'Company address' })
  address: string;

  @ApiProperty({ description: 'Company phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Company email', required: false })
  email?: string;

  @ApiProperty({ description: 'Company description', required: false })
  description?: string;

  @ApiProperty({ description: 'Warehouses associated with the company' })
  warehouses?: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}