export enum TransferType {
  INTERNAL = 'internal',    // warehouse-to-warehouse, shop-to-shop
  EXTERNAL = 'external'     // warehouse-to-shop, shop-to-warehouse
}

export enum TransferStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',    // Items have arrived at destination
  ACCEPTED = 'accepted',      // Items have been accepted by receiver
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}