export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum ExpenseType {
  OPERATIONAL = 'operational',
  ADMINISTRATIVE = 'administrative',
  MARKETING = 'marketing',
  TRAVEL = 'travel',
  MEALS = 'meals',
  OFFICE_SUPPLIES = 'office_supplies',
  UTILITIES = 'utilities',
  RENT = 'rent',
  INSURANCE = 'insurance',
  PROFESSIONAL_SERVICES = 'professional_services',
  EQUIPMENT = 'equipment',
  MAINTENANCE = 'maintenance',
  TRANSPORTATION = 'transportation',
  COMMUNICATION = 'communication',
  OTHER = 'other'
}

export enum ExpenseCategory {
  FIXED_COST = 'fixed_cost',
  VARIABLE_COST = 'variable_cost',
  SEMI_VARIABLE = 'semi_variable',
  DIRECT_COST = 'direct_cost',
  INDIRECT_COST = 'indirect_cost'
}

export enum ExpenseApprovalLevel {
  MANAGER = 'manager',
  SENIOR_MANAGER = 'senior_manager',
  FINANCE_HEAD = 'finance_head',
  CFO = 'cfo',
  CEO = 'ceo'
}

export enum ExpenseRecurrence {
  ONE_TIME = 'one_time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  MOBILE_PAYMENT = 'mobile_payment',
  PETTY_CASH = 'petty_cash'
}
