import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional, IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { UserRole } from '@/common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'StrongPassword123!', description: 'Password (optional for employee creation - will generate temporary password if not provided)' })
  @ValidateIf((o) => o.password !== undefined && o.password !== null && o.password !== '')
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

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

  @ApiPropertyOptional({ description: 'Job title for employee record' })
  @IsOptional()
  @MaxLength(255)
  jobTitle?: string;
}