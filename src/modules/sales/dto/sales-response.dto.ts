import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, SaleStatus } from '../enums';

export class SaleItemResponseDto {
  @ApiProperty({ description: 'Sale item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Product SKU' })
  productSku?: string;

  @ApiProperty({ description: 'Quantity sold' })
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ description: 'Subtotal before tax' })
  subtotal: number;

  @ApiProperty({ description: 'Tax rate percentage' })
  taxRate: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Total amount after tax and discount' })
  total: number;
}

export class SaleResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber?: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Subtotal before tax and discount' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Advance payment' })
  advancePayment: number;

  @ApiProperty({ description: 'Remaining balance' })
  remainingBalance: number;

  @ApiProperty({ description: 'Sale date' })
  saleDate: Date;

  @ApiProperty({ description: 'Payment type' })
  paymentType: PaymentType;

  @ApiProperty({ description: 'Status' })
  status: SaleStatus;

  @ApiProperty({ description: 'Note' })
  note?: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouseId: string;

  @ApiProperty({ description: 'Shop name' })
  shopName?: string;

  @ApiProperty({ description: 'Shop ID' })
  shopId?: string;

  @ApiProperty({ description: 'Sale items', type: [SaleItemResponseDto] })
  items: SaleItemResponseDto[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}
