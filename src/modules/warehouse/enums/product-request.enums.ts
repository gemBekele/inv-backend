export enum ProductRequestType {
  RESTOCK = 'restock',
  NEW_PRODUCT = 'new_product',
  URGENT_RESTOCK = 'urgent_restock'
}

export enum ProductRequestStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled'
}

export enum ProductRequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}