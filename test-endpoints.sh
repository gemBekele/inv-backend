#!/bin/bash

# Quick endpoint test script
# Usage: ./test-endpoints.sh [IP_ADDRESS]

IP="${1:-157.180.114.86}"
BASE_URL="http://${IP}:3000"

echo "Testing endpoints on ${BASE_URL}"
echo "================================"
echo ""

# Test root
echo "1. Root (/):"
curl -s "${BASE_URL}/" | head -3
echo ""
echo ""

# Test Swagger docs
echo "2. Swagger Docs (/docs):"
curl -s "${BASE_URL}/docs" | grep -i "swagger\|html\|title" | head -3
echo ""
echo ""

# Test API base
echo "3. API Base (/api/v1):"
curl -s "${BASE_URL}/api/v1" | head -3
echo ""
echo ""

# Test auth endpoint
echo "4. Auth Login (/api/v1/auth/login):"
curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -3
echo ""
echo ""

echo "Done!"









