#!/bin/bash

# Configuration
BASE_URL="http://192.168.43.160:5000/api/v1"
EMAIL="john@gmail.com"
PASSWORD="Password"  # Update with correct password

echo "=== Testing Sales Creation ==="
echo ""

# 1. Login
echo "1. Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "$TOKEN_RESPONSE" | jq '.'

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed. Please check credentials."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:30}..."
echo ""

# 2. Get customer (first one)
echo "2. Getting customer..."
CUSTOMER_RESPONSE=$(curl -s -X GET "${BASE_URL}/customers?limit=1" \
  -H "Authorization: Bearer ${TOKEN}")
CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.[0].id // .data[0].id // .data.data[0].id // empty')
echo "Customer ID: $CUSTOMER_ID"
echo ""

# 3. Get warehouse
echo "3. Getting warehouse..."
WAREHOUSE_RESPONSE=$(curl -s -X GET "${BASE_URL}/warehouses?limit=1" \
  -H "Authorization: Bearer ${TOKEN}")
WAREHOUSE_ID=$(echo "$WAREHOUSE_RESPONSE" | jq -r '.[0].id // .data[0].id // .data.data[0].id // empty')
echo "Warehouse ID: $WAREHOUSE_ID"
echo ""

# 4. Get product (try warehouse first, then general)
echo "4. Getting product..."
PRODUCT_RESPONSE=$(curl -s -X GET "${BASE_URL}/warehouses/${WAREHOUSE_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.products[0].id // .data.products[0].id // empty')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  PRODUCT_RESPONSE=$(curl -s -X GET "${BASE_URL}/products?limit=1" \
    -H "Authorization: Bearer ${TOKEN}")
  PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.[0].id // .data[0].id // .data.data[0].id // empty')
fi
echo "Product ID: $PRODUCT_ID"
echo ""

# 5. Create sale
echo "5. Creating sale..."
SALE_DATE=$(date -u +"%Y-%m-%d")
USER_ID="f0400d6e-2c7b-452a-b70d-330346c2e2a6"

SALE_BODY=$(cat <<EOF
{
  "customerId": "${CUSTOMER_ID}",
  "warehouseId": "${WAREHOUSE_ID}",
  "items": [{
    "productId": "${PRODUCT_ID}",
    "quantity": 1,
    "unitPrice": 10,
    "discountAmount": 0
  }],
  "paymentType": "cash",
  "saleDate": "${SALE_DATE}",
  "advancePayment": 0,
  "discountType": "fixed",
  "discountRate": 0,
  "createdBy": "${USER_ID}"
}
EOF
)

echo "Request body:"
echo "$SALE_BODY" | jq '.'
echo ""

SALE_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "${BASE_URL}/sales" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$SALE_BODY")

echo "Response:"
echo "$SALE_RESPONSE" | jq '.' 2>/dev/null || echo "$SALE_RESPONSE"
echo ""

SALE_ID=$(echo "$SALE_RESPONSE" | jq -r '.id // .data.id // empty' 2>/dev/null)
if [ -n "$SALE_ID" ] && [ "$SALE_ID" != "null" ]; then
  echo "✅ Sale created! ID: $SALE_ID"
else
  echo "❌ Sale creation failed"
fi


