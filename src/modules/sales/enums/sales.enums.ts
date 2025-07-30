export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_PAID = 'partially_paid',
  RETURNED = 'returned',
  DRAFT = 'draft'
}

export enum PaymentType {
  CASH = 'cash',
  CREDIT = 'credit',
  DEBIT = 'debit',
  ONLINE = 'online',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CHEQUE = 'cheque',
  CRYPTOCURRENCY = 'cryptocurrency'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BUY_ONE_GET_ONE = 'bogo',
  BULK_DISCOUNT = 'bulk_discount'
}

export enum TransactionType {
  SALE = 'sale',
  RETURN = 'return',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer'
}
