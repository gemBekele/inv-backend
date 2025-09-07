export enum CreditType {
  RECEIVABLE = 'receivable',
  PAYABLE = 'payable',
  LOAN = 'loan',
  ADVANCE = 'advance'
}

export enum CreditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  PARTIALLY_PAID = 'partially_paid',
  FULLY_PAID = 'fully_paid',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CreditRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  NO_RATING = 'no_rating'
}

export enum TransactionType {
  CREDIT_ISSUED = 'credit_issued',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_MADE = 'payment_made',
  INTEREST_APPLIED = 'interest_applied',
  LATE_FEE_APPLIED = 'late_fee_applied',
  ADJUSTMENT = 'adjustment',
  WRITE_OFF = 'write_off'
}