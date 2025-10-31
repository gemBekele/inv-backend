import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsUUID,
  IsDate,
  Min,
  IsEnum,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseApprovalLevel } from '../../expenses/enums';
import { PaymentType } from '../../sales/enums/sales.enums';

export class PurchaseOrderApprovalDto {
  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class PurchaseOrderRejectionDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  rejectionReason: string;
}

export class ReceivingItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity received' })
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @ApiProperty({ description: 'Quantity rejected' })
  @IsNumber()
  @Min(0)
  quantityRejected: number;

  @ApiPropertyOptional({ description: 'Actual unit cost (if different from ordered)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualUnitCost?: number;

  @ApiPropertyOptional({ description: 'Quality check passed' })
  @IsOptional()
  @IsBoolean()
  qualityApproved?: boolean;

  @ApiPropertyOptional({ description: 'Quality notes' })
  @IsOptional()
  @IsString()
  qualityNotes?: string;

  @ApiPropertyOptional({ description: 'Receiving notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReceivingDto {
  @ApiProperty({ description: 'Purchase order ID' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiProperty({ description: 'Receiving date' })
  @Type(() => Date)
  @IsDate()
  receivingDate: Date;

  @ApiPropertyOptional({ description: 'Supplier delivery note number' })
  @IsOptional()
  @IsString()
  supplierDeliveryNoteNumber?: string;

  @ApiPropertyOptional({ description: 'Carrier/transporter name' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ description: 'Items received', type: [ReceivingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivingItemDto)
  items: ReceivingItemDto[];

  @ApiPropertyOptional({ description: 'General receiving notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Is complete receiving (all items received)', default: false })
  @IsBoolean()
  isCompleteReceiving: boolean;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Purchase order ID' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment date' })
  @Type(() => Date)
  @IsDate()
  paymentDate: Date;

  @ApiProperty({ 
    description: 'Payment method',
    enum: PaymentType,
    example: PaymentType.CASH
  })
  @IsEnum(PaymentType)
  paymentMethod: PaymentType;

  @ApiPropertyOptional({ description: 'Reference number (check number, transaction ID, etc.)' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Check number (for cheque payments)' })
  @IsOptional()
  @IsString()
  checkNumber?: string;

  @ApiPropertyOptional({ description: 'Bank account (for bank transfer payments)' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DashboardStatsFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by date range start' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by date range end' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
