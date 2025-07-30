# Company-Warehouse Relationship Testing Guide

This document provides test cases to verify that the company-warehouse relationship is working correctly after the fixes.

## Issues Fixed

### 1. **Syntax Error in Company Service**
- **Problem**: `id:In (createCompanyDto.warehouseIds)` had incorrect syntax
- **Fix**: Changed to `id: In(createCompanyDto.warehouseIds)`

### 2. **Company Entity Duplicate Properties**
- **Problem**: Company entity was redefining `createdAt` and `updatedAt` that should come from BaseEntity
- **Fix**: Removed duplicate timestamp columns

### 3. **Property Name Inconsistency**
- **Problem**: Response DTO used `warehouse` but mapping used `warehouses`
- **Fix**: Standardized to `warehouses` (array property)

### 4. **Missing Relations Loading**
- **Problem**: `findOne` and `findAll` methods weren't loading warehouse relations
- **Fix**: Added `relations: ['warehouses']` to queries

### 5. **Incomplete Association Logic**
- **Problem**: Creating a company with warehouseIds wasn't actually associating the warehouses
- **Fix**: Added proper warehouse association logic during company creation

## Test Cases

### Test Case 1: Create Company Without Warehouses
```bash
POST /api/companies
Content-Type: application/json

{
  "name": "Test Company 1",
  "address": "123 Main St",
  "phoneNumber": "0912345678",
  "email": "test@company.com",
  "description": "A test company"
}
```

**Expected Result:**
- Company created successfully
- Response includes empty `warehouses` array
- Status: 201 Created

### Test Case 2: Create Warehouse Associated with Company
```bash
POST /api/warehouses
Content-Type: application/json

{
  "name": "Main Warehouse",
  "location": "Industrial District",
  "companyId": "{{company_id_from_test_1}}",
  "description": "Main storage facility",
  "capacity": 10000
}
```

**Expected Result:**
- Warehouse created successfully
- Warehouse is associated with the company
- Response includes `companyName`
- Status: 201 Created

### Test Case 3: Verify Company Shows Associated Warehouse
```bash
GET /api/companies/{{company_id_from_test_1}}
```

**Expected Result:**
- Company details returned
- `warehouses` array contains the warehouse ID from Test Case 2
- Status: 200 OK

### Test Case 4: Create Company With Existing Warehouses
First, create a warehouse without company association, then:

```bash
POST /api/companies
Content-Type: application/json

{
  "name": "Test Company 2",
  "address": "456 Oak Ave",
  "phoneNumber": "0987654321",
  "email": "test2@company.com",
  "description": "Another test company",
  "warehouseIds": ["{{warehouse_id}}"]
}
```

**Expected Result:**
- Company created successfully
- Warehouse is now associated with the new company
- Response includes the warehouse ID in `warehouses` array
- Status: 201 Created

### Test Case 5: Associate Additional Warehouses to Existing Company
```bash
POST /api/companies/{{company_id}}/warehouses
Content-Type: application/json

{
  "warehouseIds": ["{{another_warehouse_id}}"]
}
```

**Expected Result:**
- Additional warehouse associated with company
- Response includes all associated warehouse IDs
- Status: 200 OK

### Test Case 6: Get Company Warehouses
```bash
GET /api/companies/{{company_id}}/warehouses
```

**Expected Result:**
- Returns company details with all associated warehouses
- Status: 200 OK

### Test Case 7: Error Handling - Invalid Warehouse ID
```bash
POST /api/companies
Content-Type: application/json

{
  "name": "Test Company 3",
  "address": "789 Pine St",
  "phoneNumber": "0911111111",
  "warehouseIds": ["invalid-uuid"]
}
```

**Expected Result:**
- Error response: "One or more warehouses not found"
- Status: 404 Not Found

### Test Case 8: Error Handling - Duplicate Company Name
```bash
POST /api/companies
Content-Type: application/json

{
  "name": "Test Company 1",  // Same name as Test Case 1
  "address": "Different Address"
}
```

**Expected Result:**
- Error response: "Company with this name already exists"
- Status: 409 Conflict

## Verification Checklist

- [ ] Company can be created without warehouses
- [ ] Company can be created with existing warehouse IDs
- [ ] Warehouse can be created with company ID
- [ ] Creating warehouse with company ID properly associates them
- [ ] Creating company with warehouse IDs properly associates them
- [ ] GET company returns associated warehouse IDs
- [ ] GET company/warehouses returns warehouse details
- [ ] POST company/warehouses can add more warehouses
- [ ] Error handling works for invalid warehouse IDs
- [ ] Error handling works for duplicate company names
- [ ] Relationships are bidirectional (company ↔ warehouse)

## Database Verification

After running tests, verify in the database:

```sql
-- Check company-warehouse relationships
SELECT 
    c.id as company_id,
    c.name as company_name,
    w.id as warehouse_id,
    w.name as warehouse_name
FROM companies c
LEFT JOIN warehouses w ON w.company_id = c.id
ORDER BY c.name;

-- Check for orphaned warehouses
SELECT id, name FROM warehouses WHERE company_id IS NULL;
```

## Common Issues to Watch For

1. **Circular JSON Serialization**: Ensure entity relationships don't cause infinite loops
2. **Missing Relations**: Verify all queries load necessary relations
3. **Property Naming**: Ensure DTO properties match service mapping
4. **Validation**: Test all validation rules (UUID format, required fields, etc.)
5. **Error Messages**: Ensure error messages are helpful and accurate

## Performance Considerations

- Use `leftJoinAndSelect` instead of separate queries where possible
- Consider implementing pagination for large result sets
- Monitor N+1 query problems when loading relations
- Use database indexes on foreign key columns

---

Run these tests in order and verify each one passes before proceeding to the next. This will ensure the company-warehouse relationship is working correctly in both directions.
