export const CACHE_KEYS = {
  // User related
  USER_PROFILE: 'user:profile',
  USER_PERMISSIONS: 'user:permissions',

  // Employee related
  EMPLOYEE_LIST: 'employee:list',
  EMPLOYEE_DETAIL: 'employee:detail',
  
  // Product related
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: 'products:detail',
  PRODUCT_CATEGORIES: 'products:categories',
  PRODUCT_LOW_STOCK: 'products:low-stock',
  PRODUCT_EXPIRED: 'products:expired',

  //sales related
  SALES_LIST: 'sales:list',
  SALE_DETAIL: 'sales:detail',

  //shop related
  SHOPS_LIST: 'shops:list',
  SHOP_DETAIL: 'shops:detail',
  
  // Warehouse related
  WAREHOUSES_LIST: 'warehouses:list',
  WAREHOUSE_DETAIL: 'warehouses:detail',
  
  // Invoice related
  INVOICES_LIST: 'invoices:list',
  INVOICE_DETAIL: 'invoices:detail',
  
  // Reports
  GRAND_REPORT: 'reports:grand',
  INVENTORY_REPORT: 'reports:inventory',
  SALES_REPORT: 'reports:sales',
  
  // Settings
  SETTINGS: 'settings:general',
  COMPANY_SETTINGS: 'settings:company',
  SYSTEM_SETTINGS: 'settings:system',
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 600, // 10 minutes
  LONG: 1800, // 30 minutes
  EXTENDED: 3600, // 1 hour
} as const;