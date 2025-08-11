import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsNumber, IsPositive, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted'
}

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Contact number', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  contact: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Supplier status', enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Credit limit', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days', default: 30 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Bank details as JSON object' })
  @IsOptional()
  bankDetails?: Record<string, any>;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Supplier name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Contact number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Supplier status', enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Credit limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Bank details as JSON object' })
  @IsOptional()
  bankDetails?: Record<string, any>;
}

export class SupplierQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name or contact' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}

export class SupplierResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  id: string;

  @ApiProperty({ description: 'Supplier name' })
  name: string;

  @ApiProperty({ description: 'Contact number' })
  contact: string;

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax number' })
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  description?: string;

  @ApiProperty({ description: 'Supplier status', enum: SupplierStatus })
  status: SupplierStatus;

  @ApiProperty({ description: 'Credit limit' })
  creditLimit: number;

  @ApiProperty({ description: 'Payment terms in days' })
  paymentTermsDays: number;

  @ApiPropertyOptional({ description: 'Bank details' })
  bankDetails?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
