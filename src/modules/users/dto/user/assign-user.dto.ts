import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@/common/enums';

export class AssignUserDto {
  @ApiPropertyOptional({ description: 'Company ID to assign user to' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Shop ID to assign user to' })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID to assign user to' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Role to assign to user', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}