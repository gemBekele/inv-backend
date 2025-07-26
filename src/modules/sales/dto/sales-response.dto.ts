import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, SaleStatus } from '../enums';

export class SaleResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

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

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}