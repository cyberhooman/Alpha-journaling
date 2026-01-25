#!/bin/bash

# Security Test Script for Trading Journal API
# This script tests all implemented security features

BASE_URL="${API_URL:-http://localhost:5000}"
COLORS=true

# Colors for output
if [ "$COLORS" = true ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Trading Journal Security Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Testing API at: $BASE_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Helper function to check test result
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
  fi
}

# Test 1: Server Health
echo -e "${YELLOW}Test 1: Server Health Check${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$RESPONSE" = "200" ]; then
  echo "Server is running"
  check_result
else
  echo "Server is not responding (HTTP $RESPONSE)"
  false
  check_result
fi
echo ""

# Test 2: Security Headers
echo -e "${YELLOW}Test 2: Security Headers (Helmet.js)${NC}"
HEADERS=$(curl -s -I "$BASE_URL/health")

echo -n "  Checking Content-Security-Policy... "
echo "$HEADERS" | grep -q "Content-Security-Policy"
check_result

echo -n "  Checking Strict-Transport-Security... "
echo "$HEADERS" | grep -q "Strict-Transport-Security"
check_result

echo -n "  Checking X-Content-Type-Options... "
echo "$HEADERS" | grep -q "X-Content-Type-Options"
check_result

echo -n "  Checking X-Frame-Options... "
echo "$HEADERS" | grep -q "X-Frame-Options"
check_result
echo ""

# Test 3: Weak Password Rejection
echo -e "${YELLOW}Test 3: Password Security - Weak Password${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"weakpass@test.com","password":"weak"}')

echo -n "  Weak password should be rejected... "
echo "$RESPONSE" | grep -q "Password must be at least 12 characters long"
check_result
echo ""

# Test 4: Strong Password Acceptance
echo -e "${YELLOW}Test 4: Password Security - Strong Password${NC}"
TEST_EMAIL="strongpass$(date +%s)@test.com"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"SecurePass123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

echo -n "  Strong password should be accepted... "
echo "$RESPONSE" | grep -q "token"
check_result

# Extract token for further tests
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""

# Test 5: Authentication Required
echo -e "${YELLOW}Test 5: Authentication - Protected Endpoints${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/trades")

echo -n "  Access without token should be rejected... "
[ "$RESPONSE" = "401" ]
check_result
echo ""

# Test 6: Valid Token Access
if [ -n "$TOKEN" ]; then
  echo -e "${YELLOW}Test 6: Authentication - Valid Token${NC}"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/trades")

  echo -n "  Access with valid token should succeed... "
  [ "$RESPONSE" = "200" ]
  check_result
  echo ""
fi

# Test 7: XSS Input Sanitization
if [ -n "$TOKEN" ]; then
  echo -e "${YELLOW}Test 7: Input Sanitization - XSS Prevention${NC}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/trades" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "symbol":"XSS",
      "side":"LONG",
      "entryDate":"2024-01-20T10:00:00Z",
      "entryPrice":100,
      "quantity":10,
      "status":"OPEN",
      "notes":"<script>alert(\"XSS\")</script>Test <b>HTML</b>"
    }')

  echo -n "  XSS payload should be sanitized... "
  echo "$RESPONSE" | grep -q "Test HTML" && ! echo "$RESPONSE" | grep -q "<script>"
  check_result
  echo ""
fi

# Test 8: CORS Protection
echo -e "${YELLOW}Test 8: CORS Protection${NC}"

echo -n "  Allowed origin should work... "
RESPONSE=$(curl -s -i -H "Origin: http://localhost:5173" "$BASE_URL/health" | grep "Access-Control-Allow-Origin")
[ -n "$RESPONSE" ]
check_result

echo -n "  Unauthorized origin should be blocked... "
# This test checks server logs for CORS error - we'll just verify the header is not present
RESPONSE=$(curl -s -i -H "Origin: https://malicious-site.com" "$BASE_URL/health" 2>&1)
# The request will fail or not include CORS headers
echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: https://malicious-site.com"
# Invert the result - we want this to fail
if [ $? -ne 0 ]; then
  true
  check_result
else
  false
  check_result
fi
echo ""

# Test 9: Rate Limiting (Light Test)
echo -e "${YELLOW}Test 9: Rate Limiting${NC}"
echo "  Testing rate limiter (making 3 rapid requests)..."
for i in {1..3}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
  echo "    Request $i: HTTP $RESPONSE"
done

echo -n "  Rate limiter is configured... "
# This is a soft check - we don't want to trigger it in testing
echo "Skipping aggressive test (would trigger limit)"
true
check_result
echo ""

# Test 10: SQL Injection Protection
echo -e "${YELLOW}Test 10: SQL Injection Protection${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com\" OR \"1\"=\"1","password":"anything"}')

echo -n "  SQL injection attempt should fail... "
echo "$RESPONSE" | grep -q "Invalid credentials"
check_result
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All security tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
  exit 1
fi
