#!/bin/bash

BASE_URL="http://192.168.43.160:5000/api/v1"
EMAIL="john@gmail.com"
PASSWORD="password"

echo "=== Simple Sale Test ==="

# 1. Login
TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" \
  | jq -r '.data.accessToken')

echo "Token: ${TOKEN:0:30}..."

# 2. Create sale with known IDs (from previous test output)
CUSTOMER_ID="48a62760-e3e9-4912-818c-6d710a2a9575"
WAREHOUSE_ID="a2301e7e-9299-465d-a417-d4f546eda8de"
PRODUCT_ID="054b97e8-b50c-4b06-ad18-61a81d3041bb"  # pen - has 739 stock
USER_ID="6cd31f29-fab3-4c58-b9d0-d1144276f0a5"     # From login response
SALE_DATE=$(date -u +"%Y-%m-%d")

echo ""
echo "Creating sale..."
echo "Customer: $CUSTOMER_ID"
echo "Warehouse: $WAREHOUSE_ID"
echo "Product: $PRODUCT_ID"
echo "Date: $SALE_DATE"
echo ""

SALE_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "${BASE_URL}/sales" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"${CUSTOMER_ID}\",
    \"warehouseId\": \"${WAREHOUSE_ID}\",
    \"items\": [{
      \"productId\": \"${PRODUCT_ID}\",
      \"quantity\": 1,
      \"unitPrice\": 10,
      \"discountAmount\": 0
    }],
    \"paymentType\": \"cash\",
    \"saleDate\": \"${SALE_DATE}\",
    \"advancePayment\": 0,
    \"discountType\": \"fixed\",
    \"discountRate\": 0,
    \"createdBy\": \"${USER_ID}\"
  }")

echo "$SALE_RESPONSE" | jq '.' 2>/dev/null || echo "$SALE_RESPONSE"

SALE_ID=$(echo "$SALE_RESPONSE" | jq -r '.data.id // .id // empty' 2>/dev/null)
if [ -n "$SALE_ID" ] && [ "$SALE_ID" != "null" ]; then
  echo ""
  echo "✅ SUCCESS! Sale created with ID: $SALE_ID"
else
  echo ""
  echo "❌ FAILED to create sale"
fi


