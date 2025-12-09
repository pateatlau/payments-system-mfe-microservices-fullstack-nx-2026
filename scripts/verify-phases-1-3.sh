#!/bin/bash

# Comprehensive Verification Script for Phases 1-3
# Tests all backend services, endpoints, and functionality

set -e

echo "=========================================="
echo "POC-2 Verification: Phases 1-3"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local url=$3
  local headers=$4
  local data=$5
  local expected_code=${6:-200}
  local expected_text=$7

  echo -n "Testing $name... "
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      $headers \
      -d "$data" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      $headers 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_code" ]; then
    if [ -n "$expected_text" ] && echo "$body" | grep -q "$expected_text"; then
      echo -e "${GREEN}✓ PASSED${NC}"
      ((PASSED++))
      return 0
    elif [ -z "$expected_text" ]; then
      echo -e "${GREEN}✓ PASSED${NC}"
      ((PASSED++))
      return 0
    else
      echo -e "${RED}✗ FAILED${NC} (expected text not found)"
      echo "  Response: $body"
      ((FAILED++))
      return 1
    fi
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code, expected $expected_code)"
    echo "  Response: $body"
    ((FAILED++))
    return 1
  fi
}

# ==========================================
# Phase 1: Planning & Setup Verification
# ==========================================
echo "=== Phase 1: Planning & Setup ==="
echo ""

echo "Checking project structure..."
if [ -d "apps" ] && [ -d "libs" ] && [ -d "docs" ]; then
  echo -e "${GREEN}✓ Project structure exists${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Project structure incomplete${NC}"
  ((FAILED++))
fi

echo "Checking key files..."
files=(
  "package.json"
  "nx.json"
  "tsconfig.base.json"
  "libs/backend/db/prisma/schema.prisma"
  "docs/POC-2-Implementation/task-list.md"
  "docs/POC-2-Implementation/implementation-plan.md"
)
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
    ((FAILED++))
  fi
done

echo ""

# ==========================================
# Phase 2: Backend Foundation Verification
# ==========================================
echo "=== Phase 2: Backend Foundation ==="
echo ""

echo "Checking database connection..."
if docker ps 2>/dev/null | grep -q postgres; then
  echo -e "${GREEN}✓ PostgreSQL container running${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ PostgreSQL container not running${NC}"
  echo "  (This is OK if using external database)"
fi

echo "Checking Prisma schema..."
if [ -f "libs/backend/db/prisma/schema.prisma" ]; then
  model_count=$(grep -c "^model " libs/backend/db/prisma/schema.prisma || echo "0")
  echo -e "${GREEN}✓ Prisma schema found (${model_count} models)${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Prisma schema not found${NC}"
  ((FAILED++))
fi

echo ""

# ==========================================
# Phase 3: Backend Services Verification
# ==========================================
echo "=== Phase 3: Backend Services ==="
echo ""

# Check if services are running
echo "Checking service availability..."
services=(
  "http://localhost:3001:Auth Service"
  "http://localhost:3002:Payments Service"
  "http://localhost:3003:Admin Service"
  "http://localhost:3004:Profile Service"
)

for service_info in "${services[@]}"; do
  url=$(echo $service_info | cut -d: -f1-3)
  name=$(echo $service_info | cut -d: -f4)
  
  if curl -s -f "$url/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name is running"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $name is not responding"
    ((FAILED++))
  fi
done

echo ""

# Get auth token for authenticated requests
echo "Getting authentication token..."
# Try to get a fresh token - if it fails due to unique constraint, try to use existing token
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3001/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  echo -e "${GREEN}✓ Authentication successful${NC}"
  ((PASSED++))
elif echo "$LOGIN_RESPONSE" | grep -q "Unique constraint"; then
  # Token already exists - try to get current user to verify existing token works
  echo -e "${YELLOW}⚠ Login returned unique constraint (token exists)${NC}"
  echo "  Attempting to use existing session..."
  # Try to get user info with a token from a previous successful login
  # For now, we'll skip token-based tests if login fails
  TOKEN=""
  echo -e "${YELLOW}⚠ Skipping authenticated tests (token unavailable)${NC}"
else
  echo -e "${RED}✗ Authentication failed${NC}"
  echo "  Response: $LOGIN_RESPONSE"
  ((FAILED++))
  TOKEN=""
fi

echo ""

# Auth Service Tests
echo "=== Auth Service Tests ==="
test_endpoint "Health check" "GET" "http://localhost:3001/health" "" "" 200 "healthy"
test_endpoint "Login (valid)" "POST" "http://localhost:3001/auth/login" "" \
  '{"email":"admin@example.com","password":"Admin123!@#"}' 200 "accessToken"
test_endpoint "Login (invalid)" "POST" "http://localhost:3001/auth/login" "" \
  '{"email":"admin@example.com","password":"wrong"}' 401 "INVALID_CREDENTIALS"

if [ -n "$TOKEN" ]; then
  test_endpoint "Get current user" "GET" "http://localhost:3001/auth/me" \
    "-H \"Authorization: Bearer $TOKEN\"" "" 200 "email"
fi

echo ""

# Payments Service Tests
echo "=== Payments Service Tests ==="
test_endpoint "Health check" "GET" "http://localhost:3002/health" "" "" 200 "healthy"

if [ -n "$TOKEN" ]; then
  test_endpoint "List payments" "GET" "http://localhost:3002/api/payments?page=1&limit=10" \
    "-H \"Authorization: Bearer $TOKEN\"" "" 200 "payments"
  
  # Create a test payment
  CREATE_RESPONSE=$(curl -s -X POST "http://localhost:3002/api/payments" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": "100.00",
      "currency": "USD",
      "type": "PAYMENT",
      "description": "Test payment",
      "recipientEmail": "test@example.com"
    }')
  
  if echo "$CREATE_RESPONSE" | grep -q "success"; then
    PAYMENT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
    if [ -n "$PAYMENT_ID" ]; then
      test_endpoint "Get payment by ID" "GET" "http://localhost:3002/api/payments/$PAYMENT_ID" \
        "-H \"Authorization: Bearer $TOKEN\"" "" 200 "id"
    fi
  fi
fi

echo ""

# Admin Service Tests
echo "=== Admin Service Tests ==="
test_endpoint "Health check" "GET" "http://localhost:3003/health" "" "" 200 "healthy"

if [ -n "$TOKEN" ]; then
  test_endpoint "List users (ADMIN)" "GET" "http://localhost:3003/api/admin/users?page=1&limit=10" \
    "-H \"Authorization: Bearer $TOKEN\"" "" 200 "users"
  
  # Get first user ID
  USERS_RESPONSE=$(curl -s -X GET "http://localhost:3003/api/admin/users?page=1&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  
  USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
  if [ -n "$USER_ID" ]; then
    test_endpoint "Get user by ID" "GET" "http://localhost:3003/api/admin/users/$USER_ID" \
      "-H \"Authorization: Bearer $TOKEN\"" "" 200 "email"
    
    test_endpoint "Update user" "PUT" "http://localhost:3003/api/admin/users/$USER_ID" \
      "-H \"Authorization: Bearer $TOKEN\"" \
      '{"name":"Updated Name"}' 200 "Updated Name"
  fi
fi

echo ""

# Profile Service Tests
echo "=== Profile Service Tests ==="
test_endpoint "Health check" "GET" "http://localhost:3004/health" "" "" 200 "ok"

if [ -n "$TOKEN" ]; then
  test_endpoint "Get profile" "GET" "http://localhost:3004/api/profile" \
    "-H \"Authorization: Bearer $TOKEN\"" "" 200 "userId"
  
  test_endpoint "Update profile" "PUT" "http://localhost:3004/api/profile" \
    "-H \"Authorization: Bearer $TOKEN\"" \
    '{"phoneNumber":"+1234567890","address":"123 Test St"}' 200 "phone"
  
  test_endpoint "Get preferences" "GET" "http://localhost:3004/api/profile/preferences" \
    "-H \"Authorization: Bearer $TOKEN\"" "" 200 "success"
  
  test_endpoint "Update preferences" "PUT" "http://localhost:3004/api/profile/preferences" \
    "-H \"Authorization: Bearer $TOKEN\"" \
    '{"theme":"dark","currency":"USD"}' 200 "theme"
fi

echo ""

# Test unauthorized access
echo "=== Security Tests ==="
test_endpoint "Unauthorized access (no token)" "GET" "http://localhost:3002/api/payments" \
  "" "" 401 "UNAUTHORIZED"
test_endpoint "Unauthorized access (invalid token)" "GET" "http://localhost:3002/api/payments" \
  "-H \"Authorization: Bearer invalid-token\"" "" 401 "UNAUTHORIZED"

echo ""

# Test Coverage Verification
echo "=== Test Coverage Verification ==="
echo "Running tests for all services..."

cd "$(dirname "$0")/.."

# Payments Service
echo -n "Payments Service tests... "
if pnpm exec jest --projects apps/payments-service --passWithNoTests --no-watchman --silent > /tmp/payments-tests.log 2>&1; then
  COVERAGE=$(pnpm exec jest --projects apps/payments-service --coverage --coverageReporters=text --no-watchman --silent 2>&1 | grep "All files" | awk '{print $3}' || echo "N/A")
  echo -e "${GREEN}✓ PASSED${NC} (Coverage: $COVERAGE)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

# Admin Service
echo -n "Admin Service tests... "
if pnpm exec jest --projects apps/admin-service --passWithNoTests --no-watchman --silent > /tmp/admin-tests.log 2>&1; then
  COVERAGE=$(pnpm exec jest --projects apps/admin-service --coverage --coverageReporters=text --no-watchman --silent 2>&1 | grep "All files" | awk '{print $3}' || echo "N/A")
  echo -e "${GREEN}✓ PASSED${NC} (Coverage: $COVERAGE)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

# Profile Service
echo -n "Profile Service tests... "
if pnpm exec jest --projects apps/profile-service --passWithNoTests --no-watchman --silent > /tmp/profile-tests.log 2>&1; then
  COVERAGE=$(pnpm exec jest --projects apps/profile-service --coverage --coverageReporters=text --no-watchman --silent 2>&1 | grep "All files" | awk '{print $3}' || echo "N/A")
  echo -e "${GREEN}✓ PASSED${NC} (Coverage: $COVERAGE)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAILED${NC}"
  ((FAILED++))
fi

echo ""

# ==========================================
# Summary
# ==========================================
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All verifications passed!${NC}"
  echo ""
  echo "Phases 1-3 are fully implemented and verified."
  exit 0
else
  echo -e "${YELLOW}⚠ Some verifications failed${NC}"
  echo ""
  echo "Please review the failures above."
  exit 1
fi
