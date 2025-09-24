import { ApiProperty } from '@nestjs/swagger';

export class BranchItemDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Branch name' })
  name: string;

  @ApiProperty({ description: 'Branch type', enum: ['warehouse', 'shop'] })
  type: 'warehouse' | 'shop';

  @ApiProperty({ description: 'Branch location/address', required: false })
  location?: string;

  @ApiProperty({ description: 'Description', required: false })
  description?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}

export class BranchesResponseDto {
  @ApiProperty({ description: 'List of branches (warehouses and shops)', type: [BranchItemDto] })
  branches: BranchItemDto[];

  @ApiProperty({ description: 'Total number of branches' })
  total: number;

  @ApiProperty({ description: 'Number of warehouses' })
  totalWarehouses: number;

  @ApiProperty({ description: 'Number of shops' })
  totalShops: number;
}