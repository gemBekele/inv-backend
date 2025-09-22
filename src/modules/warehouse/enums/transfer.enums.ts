export enum TransferType {
  WAREHOUSE_TO_WAREHOUSE = 'warehouse_to_warehouse',
  WAREHOUSE_TO_SHOP = 'warehouse_to_shop',
  SHOP_TO_WAREHOUSE = 'shop_to_warehouse',
  SHOP_TO_SHOP = 'shop_to_shop'
}

export enum TransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}