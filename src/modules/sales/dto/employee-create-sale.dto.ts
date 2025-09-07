import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum, ValidateNested, IsPhoneNumber, IsNumber, Min, IsEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../enums';

class EmployeeSaleItemDto {
  @ApiProperty({ description: 'Product ID', example: 'product-uuid-1' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity of the product', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class EmployeeCreateSaleDto {
  @ApiProperty({ 
    description: 'Customer phone number for lookup', 
    example: '0911234567' 
  })
  @IsString()
  customerPhone: string;

  @ApiProperty({ 
    description: 'Array of products to sell',
    type: [EmployeeSaleItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeSaleItemDto)
  items: EmployeeSaleItemDto[];

  @ApiProperty({ 
    description: 'Payment method',
    enum: PaymentType,
    example: PaymentType.CASH
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ 
    description: 'Optional note for the sale',
    example: 'Customer requested express delivery',
    required: false
  })
  @IsOptional()
  @IsString()
  note?: string;
}
