import { ApiProperty } from '@nestjs/swagger';

export class ShopResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Shop name' })
  name: string;

  @ApiProperty({ description: 'Location' })
  location?: string;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}