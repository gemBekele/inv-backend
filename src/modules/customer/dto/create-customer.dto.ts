import { IsString, IsOptional, IsEnum, IsInt, Min, IsNumber, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '../enums/customer-status.enum';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Customer phone number of 10 digits, starting with 09 or 07',
  })
  @IsString()
  @IsNotEmpty()
  // Regex: starts with 09 or 07, followed by 8 digits
  @Matches(/^(09|07)\d{8}$/, {
    message: 'Phone number must start with 09 or 07 and be 10 digits long',
  })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  //   @ApiPropertyOptional({ description: 'Initial loyalty points' })
  //   @IsInt()
  //   @Min(0)
  //   @IsOptional()
  //   loyaltyPoints?: number;
}


