import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Employee name' })
  name: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiProperty({ description: 'Base commission rate' })
  baseCommissionRate: number;

  @ApiProperty({ description: 'Job title' })
  jobTitle?: string;

  @ApiProperty({ description: 'User username' })
  userFullName: string;

  @ApiProperty({ description: 'Shop name' })
  shopName: string;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}