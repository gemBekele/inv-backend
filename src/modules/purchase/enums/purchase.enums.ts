export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  FULLY_RECEIVED = 'fully_received',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum PurchaseItemStatus {
  PENDING = 'pending',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  FULLY_RECEIVED = 'fully_received',
  CANCELLED = 'cancelled'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved'
}

export enum PurchaseType {
  STOCK_PURCHASE = 'stock_purchase',
  SERVICE_PURCHASE = 'service_purchase',
  ASSET_PURCHASE = 'asset_purchase',
  SUPPLY_PURCHASE = 'supply_purchase'
}

export enum ReceivingStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
  OVER_RECEIVED = 'over_received'
}

export enum PurchasePaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  FULLY_PAID = 'fully_paid',
  OVERDUE = 'overdue'
}
