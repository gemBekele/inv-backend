import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  PurchaseOrderStatus, 
  ApprovalStatus, 
  PurchaseType,
  PurchasePaymentStatus,
  PurchaseItemStatus
} from '../enums/purchase.enums';

export class PurchaseItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  receivedQuantity: number;

  @ApiProperty()
  rejectedQuantity: number;

  @ApiProperty()
  remainingQuantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  actualUnitCost: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  actualTotalCost: number;

  @ApiProperty()
  finalUnitCost: number;

  @ApiProperty()
  finalTotalCost: number;

  @ApiProperty()
  netAmount: number;

  @ApiProperty()
  discountRate: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty({ enum: PurchaseItemStatus })
  status: PurchaseItemStatus;

  @ApiPropertyOptional()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional()
  actualDeliveryDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  specifications?: string;

  @ApiProperty()
  qualityChecked: boolean;

  @ApiProperty()
  qualityApproved: boolean;

  @ApiPropertyOptional()
  qualityNotes?: string;

  @ApiProperty()
  isFullyReceived: boolean;

  @ApiProperty()
  isPartiallyReceived: boolean;

  @ApiProperty()
  receivingPercentage: number;

  @ApiProperty()
  product: any; // Product details

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  poNumber: string;

  @ApiProperty({ enum: PurchaseType })
  purchaseType: PurchaseType;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status: PurchaseOrderStatus;

  @ApiProperty({ enum: ApprovalStatus })
  approvalStatus: ApprovalStatus;

  @ApiProperty({ enum: PurchasePaymentStatus })
  paymentStatus: PurchasePaymentStatus;

  @ApiProperty()
  orderDate: Date;

  @ApiPropertyOptional()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional()
  actualDeliveryDate?: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  discountRate: number;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  otherCharges: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty()
  remainingAmount: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  terms?: string;

  @ApiPropertyOptional()
  approvalNotes?: string;

  @ApiPropertyOptional()
  supplierInvoiceNumber?: string;

  @ApiPropertyOptional()
  referenceNumber?: string;

  @ApiProperty()
  paymentTermsDays: number;

  @ApiProperty()
  isUrgent: boolean;

  @ApiProperty()
  isOverdue: boolean;

  @ApiProperty()
  totalReceived: number;

  @ApiProperty()
  totalOrdered: number;

  @ApiProperty()
  receivingPercentage: number;

  @ApiProperty()
  canBeApproved: boolean;

  @ApiProperty()
  canBeReceived: boolean;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  supplier: any; // Supplier details

  @ApiProperty()
  createdBy: any; // User details

  @ApiPropertyOptional()
  approvedBy?: any; // User details

  @ApiProperty()
  warehouse: any; // Warehouse details

  @ApiPropertyOptional()
  branch?: any; // Branch details

  @ApiProperty()
  company: any; // Company details

  @ApiProperty({ type: [PurchaseItemResponseDto] })
  items: PurchaseItemResponseDto[];

  @ApiProperty()
  payments: any[]; // Payment details

  @ApiProperty()
  receivings: any[]; // Receiving details

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
