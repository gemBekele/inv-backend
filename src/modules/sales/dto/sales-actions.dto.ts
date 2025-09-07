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



export class FindCustomerByPhoneQueryDto {
  @ApiProperty({ 
    description: 'Customer phone number',
    example: '0912345678'
  })
  @IsString()
  phone: string;
}
