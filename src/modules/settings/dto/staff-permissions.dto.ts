import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureAccessDto {
  @ApiProperty({ description: 'Manage items permission' })
  @IsBoolean()
  manageItem: boolean;

  @ApiProperty({ description: 'Manage attributes permission' })
  @IsBoolean()
  manageAttribute: boolean;

  @ApiProperty({ description: 'Manage partners permission' })
  @IsBoolean()
  managePartner: boolean;

  @ApiProperty({ description: 'Manage locations permission' })
  @IsBoolean()
  manageLocation: boolean;

  @ApiProperty({ description: 'Stock in permission' })
  @IsBoolean()
  stockIn: boolean;

  @ApiProperty({ description: 'Stock out permission' })
  @IsBoolean()
  stockOut: boolean;

  @ApiProperty({ description: 'Adjust stock permission' })
  @IsBoolean()
  adjust: boolean;

  @ApiProperty({ description: 'Move stock permission' })
  @IsBoolean()
  moveStock: boolean;

  @ApiProperty({ description: 'Manage stock in drafts permission' })
  @IsBoolean()
  manageStockInDraft: boolean;

  @ApiProperty({ description: 'Manage stock out drafts permission' })
  @IsBoolean()
  manageStockOutDraft: boolean;
}

export class ItemAttributeAccessDto {
  @ApiProperty({ description: 'Type attribute access' })
  @IsBoolean()
  type: boolean;

  @ApiProperty({ description: 'Brand attribute access' })
  @IsBoolean()
  brand: boolean;
}

export class StaffPermissionsDto {
  @ApiProperty({ description: 'Feature access permissions', type: FeatureAccessDto })
  @ValidateNested()
  @Type(() => FeatureAccessDto)
  featureAccess: FeatureAccessDto;

  @ApiProperty({ description: 'Item attribute access permissions', type: ItemAttributeAccessDto })
  @ValidateNested()
  @Type(() => ItemAttributeAccessDto)
  itemAttributeAccess: ItemAttributeAccessDto;
}

export class StaffMemberDto {
  @ApiProperty({ description: 'Staff member ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Staff member name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Staff member email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Staff member role' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ description: 'Staff permissions', type: StaffPermissionsDto })
  @ValidateNested()
  @Type(() => StaffPermissionsDto)
  permissions: StaffPermissionsDto;
}

export class UpdateStaffPermissionsDto {
  @ApiProperty({ description: 'Updated permissions', type: StaffPermissionsDto })
  @ValidateNested()
  @Type(() => StaffPermissionsDto)
  permissions: StaffPermissionsDto;
}