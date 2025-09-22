import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsUUID, 
  IsEnum,
  IsNumber,
  IsPositive,
  MaxLength, 
  MinLength,
  Min,
  Max,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SupplierStatus } from '../enums/supplier-status.enum';

export class BankDetailsDto {
  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Routing number' })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'SWIFT code' })
  @IsOptional()
  @IsString()
  swiftCode?: string;
}

export class EmergencyContactDto {
  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', maxLength: 255 })
  @IsString()
  @MinLength(2, { message: 'Supplier name must be at least 2 characters' })
  @MaxLength(255, { message: 'Supplier name must not exceed 255 characters' })
  name: string;

  @ApiProperty({ description: 'Contact number', maxLength: 20 })
  @IsString()
  @MinLength(5, { message: 'Contact must be at least 5 characters' })
  @MaxLength(20, { message: 'Contact must not exceed 20 characters' })
  contact: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Contact person name must not exceed 255 characters' })
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax identification number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tax number must not exceed 100 characters' })
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Supplier status', 
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(SupplierStatus, { message: 'Invalid supplier status' })
  status?: SupplierStatus = SupplierStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Credit limit', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Credit limit must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Credit limit cannot be negative' })
  @Transform(({ value }) => parseFloat(value))
  creditLimit?: number = 0;

  @ApiPropertyOptional({ description: 'Payment terms in days', minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @IsNumber({}, { message: 'Payment terms must be a valid number' })
  @Min(1, { message: 'Payment terms must be at least 1 day' })
  @Max(365, { message: 'Payment terms cannot exceed 365 days' })
  paymentTermsDays?: number = 30;

  @ApiPropertyOptional({ description: 'Bank details', type: BankDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ description: 'Emergency contact', type: EmergencyContactDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ description: 'Company ID this supplier belongs to' })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  companyId?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Supplier name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Supplier name must be at least 2 characters' })
  @MaxLength(255, { message: 'Supplier name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Contact number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Contact must be at least 5 characters' })
  @MaxLength(20, { message: 'Contact must not exceed 20 characters' })
  contact?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Supplier address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({ description: 'Contact person name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Contact person name must not exceed 255 characters' })
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Tax identification number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tax number must not exceed 100 characters' })
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Supplier status', enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus, { message: 'Invalid supplier status' })
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Credit limit', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Credit limit must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Credit limit cannot be negative' })
  @Transform(({ value }) => parseFloat(value))
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days', minimum: 1, maximum: 365 })
  @IsOptional()
  @IsNumber({}, { message: 'Payment terms must be a valid number' })
  @Min(1, { message: 'Payment terms must be at least 1 day' })
  @Max(365, { message: 'Payment terms cannot exceed 365 days' })
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Bank details', type: BankDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ description: 'Emergency contact', type: EmergencyContactDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}

export class SupplierQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name, contact, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus, { message: 'Invalid supplier status' })
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;
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

  @ApiPropertyOptional({ description: 'Tax identification number' })
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
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ description: 'Emergency contact' })
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;

  @ApiProperty({ description: 'Company information' })
  company?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Is active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Is blacklisted status' })
  isBlacklisted: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
