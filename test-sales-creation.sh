#!/bin/bash

# Backend API base URL
BASE_URL="http://192.168.43.160:5000/api/v1"
# BASE_URL="http://localhost:5000/api/v1"  # Uncomment if testing locally

# Credentials
EMAIL="john@gmail.com"
PASSWORD="password"

echo "========================================="
echo "Testing Sales Creation API"
echo "========================================="
echo ""

# Step 1: Login and get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: Failed to get access token. Please check credentials."
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:50}..."
echo ""

# Step 2: Get customers
echo "Step 2: Fetching customers..."
CUSTOMERS_RESPONSE=$(curl -s -X GET "${BASE_URL}/customers?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "Customers Response:"
echo "$CUSTOMERS_RESPONSE" | jq '.' || echo "$CUSTOMERS_RESPONSE"
echo ""

CUSTOMER_ID=$(echo "$CUSTOMERS_RESPONSE" | jq -r '.data.data[0].id // .data[0].id // .[0].id // empty')
if [ -z "$CUSTOMER_ID" ] || [ "$CUSTOMER_ID" = "null" ]; then
  echo "ERROR: No customers found. Please create a customer first."
  exit 1
fi

echo "✅ Using Customer ID: ${CUSTOMER_ID}"
echo ""

# Step 3: Get warehouses
echo "Step 3: Fetching warehouses..."
WAREHOUSES_RESPONSE=$(curl -s -X GET "${BASE_URL}/warehouses?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "Warehouses Response:"
echo "$WAREHOUSES_RESPONSE" | jq '.' || echo "$WAREHOUSES_RESPONSE"
echo ""

WAREHOUSE_ID=$(echo "$WAREHOUSES_RESPONSE" | jq -r '.data.data[0].id // .data[0].id // .[0].id // empty')
if [ -z "$WAREHOUSE_ID" ] || [ "$WAREHOUSE_ID" = "null" ]; then
  echo "ERROR: No warehouses found."
  exit 1
fi

echo "✅ Using Warehouse ID: ${WAREHOUSE_ID}"
echo ""

# Step 4: Get products from warehouse
echo "Step 4: Fetching products from warehouse..."
WAREHOUSE_PRODUCTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/warehouses/${WAREHOUSE_ID}?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "Warehouse Products Response:"
echo "$WAREHOUSE_PRODUCTS_RESPONSE" | jq '.' || echo "$WAREHOUSE_PRODUCTS_RESPONSE"
echo ""

# Find a product with available stock
PRODUCT_ID=""
PRODUCT_UNIT_PRICE="10"

# Try to find product with stock from warehouse products
if echo "$WAREHOUSE_PRODUCTS_RESPONSE" | jq -e '.data.products != null' > /dev/null 2>&1; then
  PRODUCT_DATA=$(echo "$WAREHOUSE_PRODUCTS_RESPONSE" | jq -r '.data.products[] | select(.stockQuantity > 0) | "\(.id)|\(.price)"' | head -1)
  if [ -n "$PRODUCT_DATA" ]; then
    PRODUCT_ID=$(echo "$PRODUCT_DATA" | cut -d'|' -f1)
    PRODUCT_UNIT_PRICE=$(echo "$PRODUCT_DATA" | cut -d'|' -f2)
  fi
fi

# If no product with stock found in warehouse, try general products
if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  echo "WARNING: No products with stock found in warehouse. Trying general products..."
  
  PRODUCTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/products?limit=10" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  PRODUCT_DATA=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data.data[]? | select(.stockQuantity > 0) | "\(.id)|\(.price)"' | head -1)
  if [ -n "$PRODUCT_DATA" ]; then
    PRODUCT_ID=$(echo "$PRODUCT_DATA" | cut -d'|' -f1)
    PRODUCT_UNIT_PRICE=$(echo "$PRODUCT_DATA" | cut -d'|' -f2)
  fi
  
  if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
    echo "ERROR: No products with available stock found."
    exit 1
  fi
fi

echo "✅ Using Product ID: ${PRODUCT_ID}"
echo ""

# Step 5: Get user ID from token (or use hardcoded one)
USER_ID="f0400d6e-2c7b-452a-b70d-330346c2e2a6"

# Step 6: Create a sale
echo "Step 5: Creating sale..."
SALE_DATE=$(date -u +"%Y-%m-%d")

SALE_PAYLOAD=$(cat <<EOF
{
  "customerId": "${CUSTOMER_ID}",
  "warehouseId": "${WAREHOUSE_ID}",
  "items": [
    {
      "productId": "${PRODUCT_ID}",
      "quantity": 1,
      "unitPrice": ${PRODUCT_UNIT_PRICE},
      "discountAmount": 0,
      "notes": "Test sale via curl"
    }
  ],
  "paymentType": "cash",
  "saleDate": "${SALE_DATE}",
  "note": "Test sale created via curl script",
  "terms": "",
  "referenceNumber": "",
  "advancePayment": 0,
  "discountType": "fixed",
  "discountRate": 0,
  "createdBy": "${USER_ID}"
}
EOF
)

echo "Sale Payload:"
echo "$SALE_PAYLOAD" | jq '.'
echo ""

SALE_RESPONSE=$(curl -s -X POST "${BASE_URL}/sales" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$SALE_PAYLOAD")

echo "Sale Creation Response:"
echo "$SALE_RESPONSE" | jq '.' || echo "$SALE_RESPONSE"
echo ""

# Check if sale was created successfully
SALE_ID=$(echo "$SALE_RESPONSE" | jq -r '.data.id // .id // empty')
if [ -n "$SALE_ID" ] && [ "$SALE_ID" != "null" ]; then
  echo "✅ Sale created successfully! Sale ID: ${SALE_ID}"
  echo ""
  echo "Step 6: Fetching created sale..."
  
  GET_SALE_RESPONSE=$(curl -s -X GET "${BASE_URL}/sales/${SALE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Sale Details:"
  echo "$GET_SALE_RESPONSE" | jq '.' || echo "$GET_SALE_RESPONSE"
else
  echo "❌ Failed to create sale"
  echo "Response: $SALE_RESPONSE"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="

