import {
  IsString,
  IsOptional,
  Matches,
  IsUUID,
  ArrayNotEmpty,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Company phone number' })
  @IsString()
  // Regex: starts with 09 or 07, followed by 8 digits
  @Matches(/^(09|07)\d{8}$/, {
    message: 'Phone number must start with 09 or 07 and be 10 digits long',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Company email' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  email?: string;

  @ApiPropertyOptional({ description: 'Company description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'List of Warehouse IDs' })
  @IsString({ each: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  warehouseIds: string[];
}
export class AddWarehouseDto {
	  @ApiProperty({ description: 'List of Warehouse IDs to add' })
  @IsString({ each: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  warehouseIds: string[];
}

export class AddShopDto {
  @ApiProperty({ description: 'List of Shop IDs to add' })
  @IsString({ each: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  shopIds: string[];
}