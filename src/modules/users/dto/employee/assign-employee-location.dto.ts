import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssignEmployeeLocationDto {
  @ApiProperty({ 
    description: 'Warehouse ID to assign to employee',
    example: 'warehouse-uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ 
    description: 'Shop ID to assign to employee',
    example: 'shop-uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;
}
