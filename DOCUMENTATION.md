# NestJS Inventory Management System - Complete API Documentation

A comprehensive guide for testing and interacting with all API endpoints in the multi-tenant inventory management system.

## Prerequisites

- Base URL: `http://localhost:3000`
- All authenticated requests require: `Authorization: Bearer <access_token>`
- Content-Type: `application/json` for POST/PATCH requests

---

## Authentication Module

### 1. User Registration
**Endpoint:** `POST /api/v1/auth/register`
**Access:** Public
**Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123"
}
```
**Response:** User object with access token

### 2. User Login
**Endpoint:** `POST /api/v1/auth/login`
**Access:** Public
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:** 
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### 3. Refresh Token
**Endpoint:** `POST /api/v1/auth/refresh`
**Access:** Public
**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Branch Module

### 1. Create Branch
**Endpoint:** `POST /api/v1/branches`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Downtown Branch",
  "address": "123 Main Street, City",
  "phoneNumber": "+1234567890",
  "email": "downtown@company.com",
  "manager": "Jane Smith",
  "description": "Main downtown location"
}
```

### 2. Get All Branches
**Endpoint:** `GET /api/v1/branches`
**Access:** All authenticated users
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or address
- `isActive`: Filter by active status (true/false)

### 3. Get Branch by ID
**Endpoint:** `GET /api/v1/branches/:id`
**Access:** All authenticated users
**Path Parameters:**
- `id`: Branch UUID

### 4. Update Branch
**Endpoint:** `PATCH /api/v1/branches/:id`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Updated Branch Name",
  "isActive": false
}
```

### 5. Delete Branch
**Endpoint:** `DELETE /api/v1/branches/:id`
**Access:** Super Admin, Company Admin

---

## Collections Module

### 1. Create Product Group
**Endpoint:** `POST /api/v1/collections/product-groups`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Electronics Bundle",
  "description": "Collection of electronic items",
  "products": ["product-uuid-1", "product-uuid-2"]
}
```

### 2. Get All Product Groups
**Endpoint:** `GET /api/v1/collections/product-groups`
**Access:** All authenticated users
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name

### 3. Create Branch Collection
**Endpoint:** `POST /api/v1/collections/branches`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Regional Branches",
  "description": "Branches in the same region",
  "branches": ["branch-uuid-1", "branch-uuid-2"]
}
```

### 4. Create Supplier Collection
**Endpoint:** `POST /api/v1/collections/suppliers`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Preferred Suppliers",
  "description": "Top-rated suppliers",
  "suppliers": ["supplier-uuid-1", "supplier-uuid-2"]
}
```

---

## Commission Module

### 1. Create Commission
**Endpoint:** `POST /api/v1/commissions`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "employeeId": "employee-uuid",
  "productId": "product-uuid",
  "saleId": "sale-uuid",
  "commissionRate": 5.5,
  "commissionAmount": 49.95
}
```

### 2. Get All Commissions
**Endpoint:** `GET /api/v1/commissions`
**Access:** All authenticated users
**Query Parameters:**
- `employeeId`: Filter by employee
- `productId`: Filter by product
- `saleId`: Filter by sale
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)
- `page`: Page number
- `limit`: Items per page

### 3. Get Commission by ID
**Endpoint:** `GET /api/v1/commissions/:id`
**Access:** All authenticated users

### 4. Update Commission
**Endpoint:** `PATCH /api/v1/commissions/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "commissionRate": 6.0,
  "commissionAmount": 59.94
}
```

### 5. Delete Commission
**Endpoint:** `DELETE /api/v1/commissions/:id`
**Access:** Super Admin, Company Admin

---

## Company Module

### 1. Create Company
**Endpoint:** `POST /api/v1/companies`
**Access:** Super Admin only
**Body:**
```json
{
  "name": "TechCorp Ltd",
  "address": "123 Business Street, City, State 12345",
  "phoneNumber": "+1234567890",
  "email": "info@techcorp.com",
  "description": "Technology solutions company"
}
```

### 2. Get All Companies
**Endpoint:** `GET /api/v1/companies`
**Access:** Super Admin only
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name or email

### 3. Get Company by ID
**Endpoint:** `GET /api/v1/companies/:id`
**Access:** Super Admin, Company Admin (own company only)

### 4. Update Company
**Endpoint:** `PATCH /api/v1/companies/:id`
**Access:** Super Admin, Company Admin (own company only)
**Body:**
```json
{
  "name": "Updated Company Name",
  "phoneNumber": "+0987654321"
}
```

### 5. Delete Company
**Endpoint:** `DELETE /api/v1/companies/:id`
**Access:** Super Admin only

---

## Credit Module

### 1. Create Credit
**Endpoint:** `POST /api/v1/credits`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "type": "receivable",
  "principalAmount": 5000.00,
  "interestRate": 12.5,
  "paymentTermsDays": 30,
  "customerId": "customer-uuid",
  "creditRating": "good",
  "description": "Invoice payment for services",
  "terms": "Payment due within 30 days",
  "notes": "Customer has good payment history"
}
```

### 2. Get All Credits
**Endpoint:** `GET /api/v1/credits`
**Access:** All authenticated users
**Query Parameters:**
- `type`: Filter by type (receivable, payable, loan, advance)
- `status`: Filter by status (pending, approved, active, etc.)
- `customerId`: Filter by customer
- `creditRating`: Filter by rating
- `isOverdue`: Filter overdue credits (true/false)
- `dueDateFrom`: Filter from due date (YYYY-MM-DD)
- `dueDateTo`: Filter to due date (YYYY-MM-DD)
- `search`: Search in credit number or description
- `page`: Page number
- `limit`: Items per page

### 3. Get Credit Statistics
**Endpoint:** `GET /api/v1/credits/stats`
**Access:** Super Admin, Company Admin, Manager

### 4. Get Credit by ID
**Endpoint:** `GET /api/v1/credits/:id`
**Access:** All authenticated users

### 5. Update Credit
**Endpoint:** `PATCH /api/v1/credits/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "status": "approved",
  "interestRate": 10.0,
  "notes": "Updated terms agreed"
}
```

### 6. Approve Credit
**Endpoint:** `POST /api/v1/credits/:id/approve`
**Access:** Super Admin, Company Admin, Manager

### 7. Create Credit Payment
**Endpoint:** `POST /api/v1/credits/:id/payments`
**Access:** All authenticated users
**Body:**
```json
{
  "amount": 1000.00,
  "paymentMethod": "bank_transfer",
  "transactionReference": "TXN123456789",
  "notes": "Partial payment received"
}
```

### 8. Get Credit Payments
**Endpoint:** `GET /api/v1/credits/:id/payments`
**Access:** All authenticated users

### 9. Get Credit Transactions
**Endpoint:** `GET /api/v1/credits/:id/transactions`
**Access:** All authenticated users

### 10. Get Payment by ID
**Endpoint:** `GET /api/v1/credits/payments/:paymentId`
**Access:** All authenticated users

### 11. Delete Credit
**Endpoint:** `DELETE /api/v1/credits/:id`
**Access:** Super Admin, Company Admin

---

## Customer Module

### 1. Create Customer
**Endpoint:** `POST /api/v1/customers`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "name": "Alice Johnson",
  "phoneNumber": "+1234567890",
  "address": "456 Customer Avenue, City",
  "creditLimit": 5000.00,
  "paymentTermsDays": 30,
  "creditRating": "good",
  "allowCreditSales": true,
  "interestRate": 12.0
}
```

### 2. Get All Customers
**Endpoint:** `GET /api/v1/customers`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search by name or phone
- `status`: Filter by status
- `creditRating`: Filter by credit rating
- `allowCreditSales`: Filter by credit sales permission
- `page`: Page number
- `limit`: Items per page

### 3. Get Customer by ID
**Endpoint:** `GET /api/v1/customers/:id`
**Access:** All authenticated users

### 4. Update Customer
**Endpoint:** `PATCH /api/v1/customers/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "creditLimit": 7500.00,
  "creditRating": "excellent",
  "allowCreditSales": true
}
```

### 5. Update Customer Credit Limit
**Endpoint:** `PATCH /api/v1/customers/:id/credit-limit`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "creditLimit": 10000.00,
  "reason": "Increased based on payment history"
}
```

### 6. Approve Customer Credit
**Endpoint:** `POST /api/v1/customers/:id/approve-credit`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "creditLimit": 5000.00,
  "creditRating": "good",
  "paymentTermsDays": 30,
  "interestRate": 12.0,
  "creditNotes": "Approved based on credit check"
}
```

### 7. Toggle Customer Credit Sales
**Endpoint:** `PATCH /api/v1/customers/:id/toggle-credit-sales`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "allowCreditSales": false,
  "reason": "Temporary suspension due to overdue payments"
}
```

### 8. Get Customer Credit Stats
**Endpoint:** `GET /api/v1/customers/credit-stats`
**Access:** Super Admin, Company Admin, Manager

### 9. Delete Customer
**Endpoint:** `DELETE /api/v1/customers/:id`
**Access:** Super Admin, Company Admin

---

## Expenses Module

### 1. Create Expense
**Endpoint:** `POST /api/v1/expenses`
**Access:** All authenticated users
**Body:**
```json
{
  "title": "Office Supplies",
  "description": "Monthly office supply purchase",
  "amount": 250.00,
  "category": "office_supplies",
  "expenseDate": "2024-01-15",
  "receiptUrl": "https://example.com/receipt.pdf",
  "isReimbursable": true,
  "tags": ["office", "supplies", "monthly"]
}
```

### 2. Get All Expenses
**Endpoint:** `GET /api/v1/expenses`
**Access:** All authenticated users
**Query Parameters:**
- `category`: Filter by category
- `status`: Filter by status (pending, approved, rejected)
- `isReimbursable`: Filter reimbursable expenses
- `startDate`: Filter from date
- `endDate`: Filter to date
- `minAmount`: Minimum amount filter
- `maxAmount`: Maximum amount filter
- `page`: Page number
- `limit`: Items per page

### 3. Get Expense by ID
**Endpoint:** `GET /api/v1/expenses/:id`
**Access:** All authenticated users

### 4. Update Expense
**Endpoint:** `PATCH /api/v1/expenses/:id`
**Access:** Expense creator, Super Admin, Company Admin, Manager
**Body:**
```json
{
  "amount": 275.00,
  "description": "Updated description"
}
```

### 5. Approve Expense
**Endpoint:** `POST /api/v1/expenses/:id/approve`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "approvalNotes": "Approved for reimbursement"
}
```

### 6. Reject Expense
**Endpoint:** `POST /api/v1/expenses/:id/reject`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "rejectionReason": "Missing receipt documentation"
}
```

### 7. Add Expense Attachment
**Endpoint:** `POST /api/v1/expenses/:id/attachments`
**Access:** Expense creator, Super Admin, Company Admin, Manager
**Body:** (multipart/form-data)
```
file: [file upload]
description: "Receipt for office supplies"
```

### 8. Delete Expense
**Endpoint:** `DELETE /api/v1/expenses/:id`
**Access:** Expense creator, Super Admin, Company Admin

---

## Products Module

### 1. Create Product
**Endpoint:** `POST /api/v1/products`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone model with advanced features",
  "price": 999.99,
  "stockQuantity": 50,
  "minStockLevel": 10,
  "sku": "IPH15PRO-001",
  "barcode": "1234567890123",
  "categoryId": "category-uuid",
  "taxRate": 10.0,
  "commissionRate": 5.0,
  "weight": 0.221,
  "dimensions": "146.6 x 70.6 x 7.65 mm",
  "color": "Natural Titanium",
  "brand": "Apple"
}
```

### 2. Get All Products
**Endpoint:** `GET /api/v1/products`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search by name, SKU, or barcode
- `categoryId`: Filter by category
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `inStock`: Filter products in stock (true/false)
- `lowStock`: Filter low stock products (true/false)
- `brand`: Filter by brand
- `color`: Filter by color
- `page`: Page number
- `limit`: Items per page

### 3. Get Product by ID
**Endpoint:** `GET /api/v1/products/:id`
**Access:** All authenticated users

### 4. Update Product
**Endpoint:** `PATCH /api/v1/products/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "price": 899.99,
  "stockQuantity": 75,
  "description": "Updated description"
}
```

### 5. Scan Product Barcode
**Endpoint:** `GET /api/v1/products/scan/:barcode`
**Access:** All authenticated users
**Path Parameters:**
- `barcode`: Product barcode

### 6. Bulk Import Products
**Endpoint:** `POST /api/v1/products/bulk-import`
**Access:** Super Admin, Company Admin, Manager
**Body:** (multipart/form-data)
```
file: [CSV file upload]
```

### 7. Get Product Locations
**Endpoint:** `GET /api/v1/products/:id/locations`
**Access:** All authenticated users

### 8. Update Product Stock
**Endpoint:** `PATCH /api/v1/products/:id/stock`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "stockQuantity": 100,
  "reason": "Stock replenishment"
}
```

### 9. Delete Product
**Endpoint:** `DELETE /api/v1/products/:id`
**Access:** Super Admin, Company Admin

---

## Purchase Module

### 1. Create Purchase Order
**Endpoint:** `POST /api/v1/purchases`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "supplierId": "supplier-uuid",
  "warehouseId": "warehouse-uuid",
  "expectedDeliveryDate": "2024-02-15",
  "notes": "Urgent order for restocking",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 100,
      "unitPrice": 50.00
    }
  ]
}
```

### 2. Get All Purchase Orders
**Endpoint:** `GET /api/v1/purchases`
**Access:** All authenticated users
**Query Parameters:**
- `status`: Filter by status
- `supplierId`: Filter by supplier
- `warehouseId`: Filter by warehouse
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`: Page number
- `limit`: Items per page

### 3. Get Purchase Order by ID
**Endpoint:** `GET /api/v1/purchases/:id`
**Access:** All authenticated users

### 4. Update Purchase Order
**Endpoint:** `PATCH /api/v1/purchases/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "status": "approved",
  "expectedDeliveryDate": "2024-02-20",
  "notes": "Updated delivery date"
}
```

### 5. Approve Purchase Order
**Endpoint:** `POST /api/v1/purchases/:id/approve`
**Access:** Super Admin, Company Admin, Manager

### 6. Receive Purchase Order
**Endpoint:** `POST /api/v1/purchases/:id/receive`
**Access:** Super Admin, Company Admin, Manager, Warehouse Employee
**Body:**
```json
{
  "receivedDate": "2024-02-15",
  "items": [
    {
      "purchaseItemId": "item-uuid",
      "receivedQuantity": 95,
      "condition": "good",
      "notes": "5 items damaged in transit"
    }
  ],
  "notes": "Partial delivery received"
}
```

### 7. Create Purchase Payment
**Endpoint:** `POST /api/v1/purchases/:id/payments`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "amount": 2500.00,
  "paymentMethod": "bank_transfer",
  "paymentDate": "2024-02-16",
  "transactionReference": "TXN789456123",
  "notes": "Payment for PO #12345"
}
```

### 8. Cancel Purchase Order
**Endpoint:** `POST /api/v1/purchases/:id/cancel`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "reason": "Supplier unable to fulfill order"
}
```

---

## Reports Module

### 1. Get Sales Reports
**Endpoint:** `GET /api/v1/reports/sales`
**Access:** Super Admin, Company Admin, Manager
**Query Parameters:**
- `type`: Report type (daily, weekly, monthly, yearly)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `warehouseId`: Filter by warehouse
- `shopId`: Filter by shop
- `employeeId`: Filter by employee

### 2. Get Inventory Reports
**Endpoint:** `GET /api/v1/reports/inventory`
**Access:** Super Admin, Company Admin, Manager
**Query Parameters:**
- `type`: Report type (stock_levels, low_stock, movement)
- `warehouseId`: Filter by warehouse
- `categoryId`: Filter by category

### 3. Get Financial Reports
**Endpoint:** `GET /api/v1/reports/financial`
**Access:** Super Admin, Company Admin, Manager
**Query Parameters:**
- `type`: Report type (revenue, profit, expenses)
- `period`: Time period (daily, monthly, yearly)
- `startDate`: Start date
- `endDate`: End date

### 4. Get Employee Performance Reports
**Endpoint:** `GET /api/v1/reports/employees`
**Access:** Super Admin, Company Admin, Manager
**Query Parameters:**
- `employeeId`: Specific employee
- `startDate`: Start date
- `endDate`: End date
- `metric`: Performance metric (sales, commissions)

### 5. Get Customer Reports
**Endpoint:** `GET /api/v1/reports/customers`
**Access:** Super Admin, Company Admin, Manager
**Query Parameters:**
- `type`: Report type (top_customers, credit_analysis)
- `limit`: Number of results
- `startDate`: Start date
- `endDate`: End date

---

## Sales Module

### 1. Create Sale
**Endpoint:** `POST /api/v1/sales`
**Access:** All authenticated users
**Body:**
```json
{
  "customerId": "customer-uuid",
  "warehouseId": "warehouse-uuid",
  "shopId": "shop-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 999.99,
      "discount": 50.00
    }
  ],
  "paymentType": "credit_card",
  "advancePayment": 500.00,
  "note": "Customer purchase with partial payment"
}
```

### 2. Quick Sale (Phone Lookup)
**Endpoint:** `POST /api/v1/sales/quick-sale`
**Access:** All authenticated users
**Body:**
```json
{
  "customerPhone": "+1234567890",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1
    }
  ],
  "paymentType": "cash",
  "note": "Walk-in customer sale"
}
```

### 3. Employee Create Sale
**Endpoint:** `POST /api/v1/sales/employee/create-sale`
**Access:** Shop Employee, Manager
**Body:**
```json
{
  "customerPhone": "+1234567890",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1
    }
  ],
  "paymentType": "credit_card",
  "note": "Employee sale with commission tracking"
}
```

### 4. Get All Sales
**Endpoint:** `GET /api/v1/sales`
**Access:** All authenticated users
**Query Parameters:**
- `status`: Filter by status
- `paymentType`: Filter by payment type
- `customerId`: Filter by customer
- `employeeId`: Filter by employee
- `warehouseId`: Filter by warehouse
- `shopId`: Filter by shop
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`: Page number
- `limit`: Items per page

### 5. Get Sale by ID
**Endpoint:** `GET /api/v1/sales/:id`
**Access:** All authenticated users

### 6. Update Sale
**Endpoint:** `PATCH /api/v1/sales/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "status": "completed",
  "note": "Updated sale status"
}
```

### 7. Process Sale Payment
**Endpoint:** `POST /api/v1/sales/:id/payment`
**Access:** All authenticated users
**Body:**
```json
{
  "amount": 999.99,
  "paymentMethod": "credit_card",
  "transactionType": "sale",
  "transactionReference": "TXN123456789",
  "notes": "Payment processed successfully"
}
```

### 8. Get Sale Payment History
**Endpoint:** `GET /api/v1/sales/:id/payments`
**Access:** All authenticated users

### 9. Process Sale Return
**Endpoint:** `POST /api/v1/sales/:id/return`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "reason": "Customer not satisfied with product",
  "refundAmount": 999.99
}
```

### 10. Get Inventory Levels
**Endpoint:** `GET /api/v1/sales/inventory/:productId/:locationId`
**Access:** All authenticated users
**Query Parameters:**
- `type`: Location type (warehouse, shop)

### 11. Find Customer by Phone
**Endpoint:** `GET /api/v1/sales/customer/phone/:phone`
**Access:** All authenticated users
**Path Parameters:**
- `phone`: Customer phone number

### 12. Get User Info
**Endpoint:** `GET /api/v1/sales/user/:userId`
**Access:** All authenticated users

### 13. Get Sale Commissions
**Endpoint:** `GET /api/v1/sales/:saleId/commissions/:employeeId`
**Access:** All authenticated users

---

## Settings Module

### 1. Get All Settings
**Endpoint:** `GET /api/v1/settings`
**Access:** Super Admin, Company Admin

### 2. Get Setting by Key
**Endpoint:** `GET /api/v1/settings/:key`
**Access:** Super Admin, Company Admin

### 3. Update Setting
**Endpoint:** `PATCH /api/v1/settings/:key`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "value": "new_setting_value",
  "description": "Updated setting description"
}
```

### 4. Create Setting
**Endpoint:** `POST /api/v1/settings`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "key": "tax_rate",
  "value": "10.5",
  "type": "number",
  "description": "Default tax rate percentage"
}
```

### 5. Delete Setting
**Endpoint:** `DELETE /api/v1/settings/:key`
**Access:** Super Admin, Company Admin

---

## Shops Module

### 1. Create Shop
**Endpoint:** `POST /api/v1/shops`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Downtown Store",
  "location": "123 Main Street, Downtown",
  "description": "Main retail location",
  "warehouseId": "warehouse-uuid",
  "capacity": 1000,
  "isActive": true
}
```

### 2. Get All Shops
**Endpoint:** `GET /api/v1/shops`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search by name or location
- `warehouseId`: Filter by warehouse
- `isActive`: Filter by active status
- `page`: Page number
- `limit`: Items per page

### 3. Get Shop by ID
**Endpoint:** `GET /api/v1/shops/:id`
**Access:** All authenticated users

### 4. Update Shop
**Endpoint:** `PATCH /api/v1/shops/:id`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Updated Shop Name",
  "capacity": 1500,
  "isActive": false
}
```

### 5. Attach Product to Shop
**Endpoint:** `POST /api/v1/shops/:id/products`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "productId": "product-uuid",
  "stockQuantity": 50,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "location": "Aisle 3, Shelf B"
}
```

### 6. Get Shop Products
**Endpoint:** `GET /api/v1/shops/:id/products`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search products
- `lowStock`: Filter low stock items
- `page`: Page number
- `limit`: Items per page

### 7. Update Shop Product Stock
**Endpoint:** `PATCH /api/v1/shops/:shopId/products/:productId`
**Access:** Super Admin, Company Admin, Manager, Shop Employee
**Body:**
```json
{
  "stockQuantity": 75,
  "minStockLevel": 15
}
```

### 8. Remove Product from Shop
**Endpoint:** `DELETE /api/v1/shops/:shopId/products/:productId`
**Access:** Super Admin, Company Admin, Manager

### 9. Delete Shop
**Endpoint:** `DELETE /api/v1/shops/:id`
**Access:** Super Admin, Company Admin

---

## Supplier Module

### 1. Create Supplier
**Endpoint:** `POST /api/v1/suppliers`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "name": "Tech Supplies Inc",
  "email": "contact@techsupplies.com",
  "phoneNumber": "+1234567890",
  "address": "789 Supplier Street, Industrial District",
  "contactPerson": "John Smith",
  "taxId": "TAX123456789",
  "paymentTerms": "Net 30",
  "creditLimit": 50000.00,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+0987654321",
    "email": "emergency@techsupplies.com"
  }
}
```

### 2. Get All Suppliers
**Endpoint:** `GET /api/v1/suppliers`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search by name or email
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

### 3. Get Supplier by ID
**Endpoint:** `GET /api/v1/suppliers/:id`
**Access:** All authenticated users

### 4. Update Supplier
**Endpoint:** `PATCH /api/v1/suppliers/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "creditLimit": 75000.00,
  "status": "active",
  "paymentTerms": "Net 45"
}
```

### 5. Delete Supplier
**Endpoint:** `DELETE /api/v1/suppliers/:id`
**Access:** Super Admin, Company Admin

---

## Users Module

### 1. Get Current User Profile
**Endpoint:** `GET /api/v1/users/me`
**Access:** All authenticated users

### 2. Update Current User Profile
**Endpoint:** `PATCH /api/v1/users/me`
**Access:** All authenticated users
**Body:**
```json
{
  "firstName": "Updated First Name",
  "lastName": "Updated Last Name",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 3. Create Admin User
**Endpoint:** `POST /api/v1/users/admin`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "email": "admin@company.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "securepassword123",
  "role": "company_admin",
  "companyId": "company-uuid",
  "shopId": "shop-uuid",
  "warehouseId": "warehouse-uuid"
}
```

### 4. Get All Users
**Endpoint:** `GET /api/v1/users`
**Access:** Super Admin, Company Admin
**Query Parameters:**
- `role`: Filter by role
- `status`: Filter by status
- `companyId`: Filter by company (Super Admin only)
- `search`: Search by name or email
- `page`: Page number
- `limit`: Items per page

### 5. Get User by ID
**Endpoint:** `GET /api/v1/users/:id`
**Access:** Super Admin, Company Admin

### 6. Update User
**Endpoint:** `PATCH /api/v1/users/:id`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "role": "manager",
  "status": "active",
  "companyId": "company-uuid"
}
```

### 7. Delete User
**Endpoint:** `DELETE /api/v1/users/:id`
**Access:** Super Admin, Company Admin

### 8. Create Employee
**Endpoint:** `POST /api/v1/employees`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "userId": "user-uuid",
  "employeeId": "EMP001",
  "name": "John Doe",
  "position": "Sales Associate",
  "department": "Sales",
  "hireDate": "2024-01-15",
  "baseCommissionRate": 3.5,
  "shopId": "shop-uuid",
  "warehouseId": "warehouse-uuid"
}
```

### 9. Get All Employees
**Endpoint:** `GET /api/v1/employees`
**Access:** All authenticated users
**Query Parameters:**
- `department`: Filter by department
- `position`: Filter by position
- `shopId`: Filter by shop
- `warehouseId`: Filter by warehouse
- `isActive`: Filter by active status
- `page`: Page number
- `limit`: Items per page

### 10. Get Employee by ID
**Endpoint:** `GET /api/v1/employees/:id`
**Access:** All authenticated users

### 11. Update Employee
**Endpoint:** `PATCH /api/v1/employees/:id`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "baseCommissionRate": 4.0,
  "position": "Senior Sales Associate",
  "isActive": true
}
```

### 12. Assign Employee Location
**Endpoint:** `POST /api/v1/employees/:id/assign-location`
**Access:** Super Admin, Company Admin, Manager
**Body:**
```json
{
  "shopId": "shop-uuid",
  "warehouseId": "warehouse-uuid"
}
```

### 13. Delete Employee
**Endpoint:** `DELETE /api/v1/employees/:id`
**Access:** Super Admin, Company Admin

---

## Warehouse Module

### 1. Create Warehouse
**Endpoint:** `POST /api/v1/warehouses`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "name": "Main Warehouse",
  "location": "Industrial District, Warehouse Complex A",
  "description": "Primary storage facility",
  "capacity": 10000,
  "managerId": "user-uuid",
  "isActive": true
}
```

### 2. Get All Warehouses
**Endpoint:** `GET /api/v1/warehouses`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search by name or location
- `managerId`: Filter by manager
- `isActive`: Filter by active status
- `page`: Page number
- `limit`: Items per page

### 3. Get Warehouse by ID
**Endpoint:** `GET /api/v1/warehouses/:id`
**Access:** All authenticated users

### 4. Update Warehouse
**Endpoint:** `PATCH /api/v1/warehouses/:id`
**Access:** Super Admin, Company Admin
**Body:**
```json
{
  "capacity": 15000,
  "managerId": "new-manager-uuid",
  "isActive": false
}
```

### 5. Attach Product to Warehouse
**Endpoint:** `POST /api/v1/warehouses/:id/products`
**Access:** Super Admin, Company Admin, Manager, Warehouse Employee
**Body:**
```json
{
  "productId": "product-uuid",
  "stockQuantity": 500,
  "minStockLevel": 50,
  "maxStockLevel": 1000,
  "location": "Section A, Row 5, Shelf 3"
}
```

### 6. Get Warehouse Products
**Endpoint:** `GET /api/v1/warehouses/:id/products`
**Access:** All authenticated users
**Query Parameters:**
- `search`: Search products
- `lowStock`: Filter low stock items
- `categoryId`: Filter by category
- `page`: Page number
- `limit`: Items per page

### 7. Update Warehouse Product Stock
**Endpoint:** `PATCH /api/v1/warehouses/:warehouseId/products/:productId`
**Access:** Super Admin, Company Admin, Manager, Warehouse Employee
**Body:**
```json
{
  "stockQuantity": 750,
  "minStockLevel": 75,
  "location": "Section B, Row 2, Shelf 1"
}
```

### 8. Remove Product from Warehouse
**Endpoint:** `DELETE /api/v1/warehouses/:warehouseId/products/:productId`
**Access:** Super Admin, Company Admin, Manager

### 9. Get Warehouse Stock Report
**Endpoint:** `GET /api/v1/warehouses/:id/stock-report`
**Access:** All authenticated users
**Query Parameters:**
- `format`: Report format (json, csv, pdf)
- `includeZeroStock`: Include zero stock items

### 10. Delete Warehouse
**Endpoint:** `DELETE /api/v1/warehouses/:id`
**Access:** Super Admin, Company Admin

---

## Module Relationships and Interactions

### 1. Authentication Flow
```
1. POST /api/v1/auth/login → Get access_token
2. Use token in Authorization header for all subsequent requests
3. POST /api/v1/auth/refresh → Refresh expired tokens
```

### 2. Multi-Tenant Setup Flow
```
1. Super Admin creates Company → POST /api/v1/companies
2. Super Admin creates Company Admin → POST /api/v1/users/admin
3. Company Admin creates infrastructure:
   - Warehouses → POST /api/v1/warehouses
   - Shops → POST /api/v1/shops
   - Products → POST /api/v1/products
   - Customers → POST /api/v1/customers
   - Employees → POST /api/v1/employees
```

### 3. Sales Process Flow
```
1. Employee login → POST /api/v1/auth/login
2. Find customer → GET /api/v1/sales/customer/phone/:phone
3. Create sale → POST /api/v1/sales/quick-sale
4. Process payment → POST /api/v1/sales/:id/payment
5. View commissions → GET /api/v1/commissions?employeeId=:id
```

### 4. Credit Management Flow
```
1. Create customer credit → POST /api/v1/customers/:id/approve-credit
2. Create receivable → POST /api/v1/credits (type: receivable)
3. Process payment → POST /api/v1/credits/:id/payments
4. Track transactions → GET /api/v1/credits/:id/transactions
5. View analytics → GET /api/v1/credits/stats
```

### 5. Inventory Management Flow
```
1. Create products → POST /api/v1/products
2. Attach to warehouse → POST /api/v1/warehouses/:id/products
3. Attach to shop → POST /api/v1/shops/:id/products
4. Create purchase order → POST /api/v1/purchases
5. Receive inventory → POST /api/v1/purchases/:id/receive
6. Process sales → POST /api/v1/sales (updates inventory)
7. Check stock levels → GET /api/v1/warehouses/:id/products
```

### 6. Purchase Order Flow
```
1. Create supplier → POST /api/v1/suppliers
2. Create purchase order → POST /api/v1/purchases
3. Approve order → POST /api/v1/purchases/:id/approve
4. Receive goods → POST /api/v1/purchases/:id/receive
5. Process payment → POST /api/v1/purchases/:id/payments
```

### 7. Expense Management Flow
```
1. Create expense → POST /api/v1/expenses
2. Add attachments → POST /api/v1/expenses/:id/attachments
3. Manager approval → POST /api/v1/expenses/:id/approve
4. View reports → GET /api/v1/reports/financial?type=expenses
```

### 8. Reporting Flow
```
1. Sales reports → GET /api/v1/reports/sales
2. Inventory reports → GET /api/v1/reports/inventory
3. Employee performance → GET /api/v1/reports/employees
4. Financial reports → GET /api/v1/reports/financial
5. Customer analysis → GET /api/v1/reports/customers
```

---

## Testing Scenarios

### Scenario 1: Complete Multi-Tenant Setup
```
1. POST /api/v1/auth/login (Super Admin)
2. POST /api/v1/companies (Create Company A)
3. POST /api/v1/companies (Create Company B)
4. POST /api/v1/users/admin (Create Admin for Company A)
5. POST /api/v1/users/admin (Create Admin for Company B)
6. POST /api/v1/auth/login (Company A Admin)
7. POST /api/v1/warehouses (Company A Warehouse)
8. POST /api/v1/auth/login (Company B Admin)
9. POST /api/v1/warehouses (Company B Warehouse)
10. Verify data isolation between companies
```

### Scenario 2: End-to-End Sales Process
```
1. POST /api/v1/auth/login (Employee)
2. GET /api/v1/sales/user/:userId (Get user context)
3. POST /api/v1/customers (Create customer)
4. POST /api/v1/products (Create product)
5. POST /api/v1/warehouses/:id/products (Add stock)
6. POST /api/v1/sales/quick-sale (Create sale)
7. POST /api/v1/sales/:id/payment (Process payment)
8. GET /api/v1/commissions (View commissions)
9. GET /api/v1/warehouses/:id/products (Check updated stock)
```

### Scenario 3: Credit Management Workflow
```
1. POST /api/v1/customers (Create customer)
2. POST /api/v1/customers/:id/approve-credit (Approve credit)
3. POST /api/v1/credits (Create receivable)
4. POST /api/v1/credits/:id/approve (Approve credit)
5. POST /api/v1/credits/:id/payments (Process payment)
6. GET /api/v1/credits/:id/transactions (View history)
7. GET /api/v1/credits/stats (View analytics)
```

### Scenario 4: Purchase and Inventory Management
```
1. POST /api/v1/suppliers (Create supplier)
2. POST /api/v1/purchases (Create PO)
3. POST /api/v1/purchases/:id/approve (Approve PO)
4. POST /api/v1/purchases/:id/receive (Receive goods)
5. GET /api/v1/warehouses/:id/products (Check stock)
6. POST /api/v1/sales (Create sale - reduces stock)
7. GET /api/v1/reports/inventory (View inventory report)
```

---

## Error Handling and Status Codes

### Common HTTP Status Codes
- `200 OK`: Successful GET, PATCH requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (duplicate data)
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server errors

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

---

## Authentication and Authorization

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "company_admin",
  "company": {
    "id": "company-uuid",
    "name": "Company Name"
  },
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Access Control
- **Super Admin**: Full system access, all companies
- **Company Admin**: Full access to own company data
- **Manager**: Management operations within assigned locations
- **Shop Employee**: Sales operations, limited inventory access
- **Warehouse Employee**: Inventory operations, receiving goods
- **User**: Basic access, own profile management

---

## Rate Limiting and Throttling

### Default Limits
- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute
- **Report generation**: 20 requests per hour

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Response Format
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

## File Uploads

### Supported Formats
- **Images**: JPG, PNG, GIF (max 5MB)
- **Documents**: PDF, DOC, DOCX (max 10MB)
- **Spreadsheets**: CSV, XLS, XLSX (max 25MB)

### Upload Response
```json
{
  "id": "file-uuid",
  "filename": "receipt.pdf",
  "originalName": "receipt_2024.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "url": "https://example.com/files/receipt.pdf"
}
```