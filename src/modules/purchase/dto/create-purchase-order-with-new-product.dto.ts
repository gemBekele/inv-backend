import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsEnum, 
  IsBoolean,
  Min,
  Max,
  IsUUID,
  IsObject,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseType } from '../enums/purchase.enums';
import { ProductType } from '../../products/enums';

export class CreateNewProductForPurchaseDto {
  @ApiProperty({ 
    enum: ProductType, 
    description: 'Type of product (product or service)' 
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ 
    description: 'Product name',
    example: 'New Product Name'
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ 
    description: 'Product description',
    example: 'Product description'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Product category',
    example: 'Electronics'
  })
  @IsString()
  @Length(1, 100)
  category: string;

  @ApiProperty({ 
    description: 'Unit of measurement',
    example: 'piece'
  })
  @IsString()
  @Length(1, 50)
  unit: string;

  @ApiProperty({ 
    description: 'Selling price',
    example: 999.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ 
    description: 'Cost price',
    example: 750.00
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost?: number;

  @ApiPropertyOptional({ 
    description: 'Tax rate percentage',
    example: 7.5,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  taxRate?: number;

  @ApiPropertyOptional({ 
    description: 'Additional metadata as JSON object',
    example: { brand: 'Apple', model: '2023' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreatePurchaseItemWithNewProductDto {
  @ApiProperty({ description: 'New product details', type: CreateNewProductForPurchaseDto })
  @ValidateNested()
  @Type(() => CreateNewProductForPurchaseDto)
  product: CreateNewProductForPurchaseDto;

  @ApiProperty({ description: 'Quantity to purchase' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Discount rate (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiPropertyOptional({ description: 'Tax rate (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ description: 'Item notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Product specifications' })
  @IsOptional()
  @IsString()
  specifications?: string;
}

export class CreatePurchaseOrderWithNewProductDto {
  @ApiPropertyOptional({ description: 'Company ID (required for super admin)' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ 
    description: 'Purchase type',
    enum: PurchaseType,
    default: PurchaseType.STOCK_PURCHASE
  })
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @ApiProperty({ description: 'Order date' })
  @Type(() => Date)
  @IsDate()
  orderDate: Date;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ description: 'Due date for payment' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiProperty({ description: 'Purchase items with new products', type: [CreatePurchaseItemWithNewProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemWithNewProductDto)
  items: CreatePurchaseItemWithNewProductDto[];

  @ApiPropertyOptional({ description: 'Discount rate (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiPropertyOptional({ description: 'Shipping cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Other charges' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCharges?: number;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Supplier invoice number' })
  @IsOptional()
  @IsString()
  supplierInvoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ description: 'Payment terms in days', default: 30 })
  @IsNumber()
  @Min(0)
  paymentTermsDays: number;

  @ApiProperty({ description: 'Is urgent order', default: false })
  @IsBoolean()
  isUrgent: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}