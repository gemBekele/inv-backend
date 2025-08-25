import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';
import { SaleStatus } from '../enums';

export class UpdateSaleStatusDto {
  @ApiProperty({ 
    description: 'New sale status',
    enum: SaleStatus
  })
  @IsEnum(SaleStatus)
  status: SaleStatus;

  @ApiProperty({ description: 'User ID making the status change' })
  @IsUUID()
  userId: string;
}

export class ProcessSaleReturnDto {
  @ApiProperty({ description: 'Return reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'User ID processing the return' })
  @IsUUID()
  userId: string;
}

export class GetInventoryLevelsQueryDto {
  @ApiProperty({ 
    description: 'Location type',
    enum: ['warehouse', 'shop'],
    example: 'warehouse'
  })
  @IsEnum(['warehouse', 'shop'])
  type: 'warehouse' | 'shop';
}

export class DailySalesReportQueryDto {
  @ApiProperty({ 
    description: 'Date for the report (YYYY-MM-DD format)',
    required: false,
    example: '2024-01-15'
  })
  @IsString()
  date?: string;
}

export class MonthlySalesReportQueryDto {
  @ApiProperty({ 
    description: 'Year for the report',
    required: false,
    example: 2024
  })
  year?: number;

  @ApiProperty({ 
    description: 'Month for the report (1-12)',
    required: false,
    example: 1
  })
  month?: number;
}

export class FindCustomerByPhoneQueryDto {
  @ApiProperty({ 
    description: 'Customer phone number',
    example: '+1234567890'
  })
  @IsString()
  phone: string;
}
