#!/bin/bash

# Test authentication endpoints
# Usage: ./test-auth-endpoints.sh [IP_ADDRESS]

IP="${1:-157.180.114.86}"
BASE_URL="http://${IP}:3000"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123456}"

echo "=========================================="
echo "Testing Authentication Endpoints"
echo "=========================================="
echo "Server: ${BASE_URL}"
echo "Admin Email: ${ADMIN_EMAIL}"
echo "Admin Password: ${ADMIN_PASSWORD}"
echo ""
echo ""

# Test 1: Login endpoint
echo "1. Testing POST /api/v1/auth/login"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo ""

# Test 2: Register endpoint (to see if any routes work)
echo "2. Testing POST /api/v1/auth/register"
echo "--------------------------------------"
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}')

REGISTER_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $REGISTER_HTTP_CODE"
echo "Response:"
echo "$REGISTER_BODY" | jq '.' 2>/dev/null || echo "$REGISTER_BODY"
echo ""
echo ""

# Test 3: Check Swagger docs
echo "3. Testing GET /docs (Swagger UI)"
echo "----------------------------------"
SWAGGER_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/docs")
echo "HTTP Status: $SWAGGER_CODE"
echo ""

# Test 4: Check root
echo "4. Testing GET / (Root)"
echo "------------------------"
ROOT_RESPONSE=$(curl -s "${BASE_URL}/")
echo "$ROOT_RESPONSE" | head -3
echo ""

echo "=========================================="
echo "Summary:"
echo "=========================================="
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login endpoint is working!"
    echo ""
    TOKEN=$(echo "$BODY" | jq -r '.accessToken // .access_token // .data.accessToken // .data.access_token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "✅ Authentication successful!"
        echo "Token (first 50 chars): ${TOKEN:0:50}..."
        echo ""
        echo "You can use this token for authenticated requests:"
        echo "  Authorization: Bearer $TOKEN"
    else
        echo "⚠️  Login responded but no token found in response"
    fi
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Login endpoint returned 404 - Route not found"
    echo "   This suggests routes are not properly registered"
    echo "   Check PM2 logs: pm2 logs gelagle-stock-backend"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Login endpoint returned 401 - Authentication failed"
    echo "   Credentials might be incorrect or user doesn't exist"
    echo "   Check if admin seeder ran: Check PM2 logs for 'Admin seeding completed'"
else
    echo "❌ Login endpoint returned: $HTTP_CODE"
fi
echo ""









