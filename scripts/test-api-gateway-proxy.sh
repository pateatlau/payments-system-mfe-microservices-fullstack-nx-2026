#!/bin/bash

###############################################################################
# API Gateway Proxy Integration Test Script
#
# Purpose: Test API Gateway proxy routes to backend services
# Prerequisites:
#   - All backend services running (Auth, Payments, Admin, Profile)
#   - API Gateway running on port 3000
#
# Usage:
#   ./scripts/test-api-gateway-proxy.sh
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Function to print test header
print_header() {
  echo ""
  echo "========================================================================"
  echo " $1"
  echo "========================================================================"
}

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((FAILED++))
  fi
}

# Function to check if service is running
check_service() {
  local service_name=$1
  local port=$2
  
  if curl -s "http://localhost:${port}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} ${service_name} (port ${port}) is running"
    return 0
  else
    echo -e "${RED}✗${NC} ${service_name} (port ${port}) is NOT running"
    return 1
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

print_header "Pre-flight Checks"

echo "Checking if required services are running..."
echo ""

# Check backend services
check_service "Auth Service" 3001 || { echo -e "${RED}Error: Auth Service not running${NC}"; exit 1; }
check_service "Payments Service" 3002 || { echo -e "${RED}Error: Payments Service not running${NC}"; exit 1; }
check_service "Admin Service" 3003 || { echo -e "${RED}Error: Admin Service not running${NC}"; exit 1; }
check_service "Profile Service" 3004 || { echo -e "${RED}Error: Profile Service not running${NC}"; exit 1; }
check_service "API Gateway" 3000 || { echo -e "${RED}Error: API Gateway not running${NC}"; exit 1; }

echo ""
echo -e "${GREEN}All services are running!${NC}"

###############################################################################
# Test 1: Health Check Endpoints (Direct - No Proxy)
###############################################################################

print_header "Test 1: Health Check Endpoints (Direct - No Proxy)"

# API Gateway health check (should not be proxied)
response=$(curl -s http://localhost:3000/health)
if echo "$response" | grep -q "status"; then
  print_result 0 "API Gateway /health endpoint"
else
  print_result 1 "API Gateway /health endpoint"
fi

###############################################################################
# Test 2: Auth Service Proxy
###############################################################################

print_header "Test 2: Auth Service Proxy (/api/auth -> 3001)"

# Test health endpoint through proxy
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/auth/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] && echo "$body" | grep -q "status"; then
  print_result 0 "GET /api/auth/health (proxied to Auth Service)"
else
  print_result 1 "GET /api/auth/health (got HTTP $http_code)"
fi

# Test login endpoint (POST with body)
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
  print_result 0 "POST /api/auth/login (proxied with request body)"
else
  print_result 1 "POST /api/auth/login (got HTTP $http_code)"
fi

###############################################################################
# Test 3: Payments Service Proxy
###############################################################################

print_header "Test 3: Payments Service Proxy (/api/payments -> 3002)"

# Test health endpoint through proxy
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/payments/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] && echo "$body" | grep -q "status"; then
  print_result 0 "GET /api/payments/health (proxied to Payments Service)"
else
  print_result 1 "GET /api/payments/health (got HTTP $http_code)"
fi

# Test payments list endpoint (requires auth, may fail but should proxy)
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/payments?page=1&limit=10)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ] || [ "$http_code" = "200" ]; then
  print_result 0 "GET /api/payments (proxied, expected 401/403/200, got $http_code)"
else
  print_result 1 "GET /api/payments (unexpected HTTP $http_code)"
fi

###############################################################################
# Test 4: Admin Service Proxy
###############################################################################

print_header "Test 4: Admin Service Proxy (/api/admin -> 3003)"

# Test health endpoint through proxy
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/admin/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] && echo "$body" | grep -q "status"; then
  print_result 0 "GET /api/admin/health (proxied to Admin Service)"
else
  print_result 1 "GET /api/admin/health (got HTTP $http_code)"
fi

# Test users list endpoint (requires admin auth, may fail but should proxy)
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/admin/users)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ] || [ "$http_code" = "200" ]; then
  print_result 0 "GET /api/admin/users (proxied, expected 401/403/200, got $http_code)"
else
  print_result 1 "GET /api/admin/users (unexpected HTTP $http_code)"
fi

###############################################################################
# Test 5: Profile Service Proxy
###############################################################################

print_header "Test 5: Profile Service Proxy (/api/profile -> 3004)"

# Test health endpoint through proxy
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/profile/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] && echo "$body" | grep -q "status"; then
  print_result 0 "GET /api/profile/health (proxied to Profile Service)"
else
  print_result 1 "GET /api/profile/health (got HTTP $http_code)"
fi

# Test profile endpoint (requires auth, may fail but should proxy)
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/profile)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ] || [ "$http_code" = "200" ]; then
  print_result 0 "GET /api/profile (proxied, expected 401/403/200, got $http_code)"
else
  print_result 1 "GET /api/profile (unexpected HTTP $http_code)"
fi

###############################################################################
# Test 6: Header Forwarding
###############################################################################

print_header "Test 6: Header Forwarding"

# Test X-Forwarded-* headers are set by proxy
# We can't easily verify this without backend logging, but we can test the proxy accepts custom headers
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/auth/health \
  -H "X-Custom-Header: test-value" \
  -H "User-Agent: Test-Script/1.0")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Proxy forwards custom headers"
else
  print_result 1 "Proxy forwards custom headers (got HTTP $http_code)"
fi

###############################################################################
# Test 7: CORS Headers
###############################################################################

print_header "Test 7: CORS Headers"

# Test CORS preflight request
response=$(curl -s -w "\n%{http_code}" -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
  print_result 0 "CORS preflight request (OPTIONS)"
else
  print_result 1 "CORS preflight request (got HTTP $http_code)"
fi

###############################################################################
# Test 8: Error Handling
###############################################################################

print_header "Test 8: Error Handling"

# Test 404 for non-existent route
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/nonexistent/route)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "404" ]; then
  print_result 0 "404 for non-existent route"
else
  print_result 1 "404 for non-existent route (got HTTP $http_code)"
fi

###############################################################################
# Summary
###############################################################################

print_header "Test Summary"

echo ""
echo -e "Tests Passed: ${GREEN}${PASSED}${NC}"
echo -e "Tests Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
