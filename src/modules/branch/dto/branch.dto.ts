import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEmail, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name', maxLength: 255 })
  @IsString()
  @MinLength(2, { message: 'Branch name must be at least 2 characters' })
  @MaxLength(255, { message: 'Branch name must not exceed 255 characters' })
  name: string;

  @ApiProperty({ description: 'Branch address', maxLength: 255 })
  @IsString()
  @MinLength(5, { message: 'Address must be at least 5 characters' })
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Manager name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Manager name must not exceed 255 characters' })
  manager?: string;

  @ApiPropertyOptional({ description: 'Branch description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is branch active', default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;

  @ApiProperty({ description: 'Company ID this branch belongs to' })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  companyId: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ description: 'Branch name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Branch name must be at least 2 characters' })
  @MaxLength(255, { message: 'Branch name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Branch address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Address must be at least 5 characters' })
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Manager name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Manager name must not exceed 255 characters' })
  manager?: string;

  @ApiPropertyOptional({ description: 'Branch description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is branch active' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class BranchQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name, address, or manager' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  companyId?: string;
}

export class BranchResponseDto {
  @ApiProperty({ description: 'Branch ID' })
  id: string;

  @ApiProperty({ description: 'Branch name' })
  name: string;

  @ApiProperty({ description: 'Branch address' })
  address: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Manager name' })
  manager?: string;

  @ApiPropertyOptional({ description: 'Branch description' })
  description?: string;

  @ApiProperty({ description: 'Is branch active' })
  isActive: boolean;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Company information' })
  company?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
