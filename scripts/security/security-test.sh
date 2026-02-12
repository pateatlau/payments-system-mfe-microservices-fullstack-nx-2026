#!/bin/bash
#
# Security Testing Script for MFE Payments System
#
# This script performs comprehensive security testing including:
# - Cookie security verification
# - Session fingerprinting tests
# - Auth flow security tests
# - OWASP ZAP scanning (optional)
#
# Prerequisites:
# - Application running (pnpm infra:start && pnpm dev:backend && pnpm dev:all)
# - curl, jq installed
# - Docker (for ZAP scanning)
#
# Usage:
#   ./scripts/security/security-test.sh [options]
#
# Options:
#   --quick       Run quick tests only (no ZAP scan)
#   --full        Run full test suite including ZAP scan
#   --zap-only    Run only ZAP scan
#   --help        Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://localhost}"
API_URL="${API_URL:-https://localhost/api}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test123!@#}"

# Results tracking
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
  echo -e "${YELLOW}[TEST]${NC} $1"
}

print_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((PASSED++))
}

print_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((FAILED++))
}

print_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
  ((WARNINGS++))
}

print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check curl
  if command -v curl &> /dev/null; then
    print_pass "curl is installed"
  else
    print_fail "curl is not installed"
    exit 1
  fi

  # Check jq
  if command -v jq &> /dev/null; then
    print_pass "jq is installed"
  else
    print_fail "jq is not installed (required for JSON parsing)"
    exit 1
  fi

  # Check if application is running
  if curl -ks "${BASE_URL}/health" > /dev/null 2>&1; then
    print_pass "Application is reachable at ${BASE_URL}"
  else
    print_fail "Application not reachable at ${BASE_URL}"
    print_info "Start the application with: pnpm infra:start && pnpm dev:backend && pnpm dev:all"
    exit 1
  fi

  # Check API Gateway
  if curl -ks "${API_URL}/health" > /dev/null 2>&1; then
    print_pass "API Gateway is reachable at ${API_URL}"
  else
    print_warn "API Gateway not reachable at ${API_URL}"
  fi
}

# Test 1: Cookie Security Attributes
test_cookie_security() {
  print_header "Testing Cookie Security Attributes"

  print_test "Attempting login to check Set-Cookie headers..."

  # Perform login and capture headers
  RESPONSE=$(curl -ks -D - -o /dev/null -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" 2>&1)

  # Check for Set-Cookie header
  if echo "$RESPONSE" | grep -qi "Set-Cookie"; then
    print_pass "Set-Cookie header present in login response"
  else
    print_warn "No Set-Cookie header found (may need valid credentials)"
    return
  fi

  # Check HttpOnly flag
  if echo "$RESPONSE" | grep -qi "HttpOnly"; then
    print_pass "HttpOnly flag is set on cookies"
  else
    print_fail "HttpOnly flag is NOT set - cookies vulnerable to XSS"
  fi

  # Check Secure flag
  if echo "$RESPONSE" | grep -qi "Secure"; then
    print_pass "Secure flag is set on cookies"
  else
    print_fail "Secure flag is NOT set - cookies can be sent over HTTP"
  fi

  # Check SameSite flag
  if echo "$RESPONSE" | grep -qi "SameSite"; then
    print_pass "SameSite flag is set on cookies"

    if echo "$RESPONSE" | grep -qi "SameSite=Strict"; then
      print_pass "SameSite=Strict (maximum CSRF protection)"
    elif echo "$RESPONSE" | grep -qi "SameSite=Lax"; then
      print_warn "SameSite=Lax (partial CSRF protection)"
    fi
  else
    print_fail "SameSite flag is NOT set - vulnerable to CSRF"
  fi
}

# Test 2: Session Fingerprinting
test_session_fingerprinting() {
  print_header "Testing Session Fingerprinting (Task 7.3)"

  print_test "Testing if server validates X-Client-Fingerprint header..."

  # Generate a fake fingerprint
  FINGERPRINT="test-fingerprint-$(date +%s)"

  # Try to refresh with mismatched fingerprint (should fail)
  print_test "Attempting token refresh with invalid fingerprint..."

  RESPONSE=$(curl -ks -w "\n%{http_code}" -X POST "${API_URL}/auth/refresh" \
    -H "Content-Type: application/json" \
    -H "X-Client-Fingerprint: tampered-fingerprint-12345" \
    --cookie "mfe_refresh_token=fake-token" 2>&1)

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
    print_pass "Server rejected request with invalid/mismatched fingerprint (HTTP $HTTP_CODE)"
  else
    print_warn "Server returned HTTP $HTTP_CODE for invalid fingerprint (expected 401 or 403)"
  fi
}

# Test 3: Token Storage
test_token_storage() {
  print_header "Testing Token Storage (Task 7.2)"

  print_test "Verifying refresh tokens are NOT in response body..."

  RESPONSE=$(curl -ks -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" 2>&1)

  # Check if refreshToken is in the response body
  if echo "$RESPONSE" | grep -qi '"refreshToken"'; then
    print_fail "Refresh token found in response body - should only be in HttpOnly cookie"
  else
    print_pass "Refresh token NOT in response body (stored in HttpOnly cookie)"
  fi

  # Check if accessToken is present
  if echo "$RESPONSE" | grep -qi '"accessToken"'; then
    print_pass "Access token present in response body (expected)"
  else
    print_warn "No access token in response (may need valid credentials)"
  fi
}

# Test 4: CSRF Protection
test_csrf_protection() {
  print_header "Testing CSRF Protection"

  print_test "Checking if state-changing endpoints require CSRF tokens..."

  # Try to make a POST request without CSRF token
  RESPONSE=$(curl -ks -w "\n%{http_code}" -X POST "${API_URL}/auth/logout" \
    -H "Content-Type: application/json" \
    -H "Origin: https://evil-site.com" 2>&1)

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$HTTP_CODE" == "403" || "$HTTP_CODE" == "401" ]]; then
    print_pass "Server blocked request from different origin (HTTP $HTTP_CODE)"
  else
    print_warn "Server returned HTTP $HTTP_CODE for cross-origin request"
  fi

  # Check for CSRF token endpoint
  print_test "Checking for CSRF token endpoint..."

  RESPONSE=$(curl -ks -w "\n%{http_code}" "${API_URL}/auth/csrf-token" 2>&1)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$HTTP_CODE" == "200" ]]; then
    print_pass "CSRF token endpoint available"
  elif [[ "$HTTP_CODE" == "404" ]]; then
    print_info "No dedicated CSRF token endpoint (may use other protection)"
  else
    print_warn "CSRF endpoint returned HTTP $HTTP_CODE"
  fi
}

# Test 5: Rate Limiting
test_rate_limiting() {
  print_header "Testing Rate Limiting"

  print_test "Sending multiple rapid requests to check rate limiting..."

  BLOCKED=false
  for i in {1..15}; do
    RESPONSE=$(curl -ks -w "%{http_code}" -o /dev/null -X POST "${API_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"wrong"}' 2>&1)

    if [[ "$RESPONSE" == "429" ]]; then
      print_pass "Rate limiting active - blocked after $i requests (HTTP 429)"
      BLOCKED=true
      break
    fi
  done

  if [[ "$BLOCKED" == "false" ]]; then
    print_warn "Rate limiting may not be active (no 429 response after 15 requests)"
  fi
}

# Test 6: Security Headers
test_security_headers() {
  print_header "Testing Security Headers"

  HEADERS=$(curl -ks -I "${BASE_URL}" 2>&1)

  # Check X-Content-Type-Options
  if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
    print_pass "X-Content-Type-Options: nosniff"
  else
    print_warn "Missing X-Content-Type-Options header"
  fi

  # Check X-Frame-Options
  if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    print_pass "X-Frame-Options header present"
  else
    print_warn "Missing X-Frame-Options header (clickjacking protection)"
  fi

  # Check X-XSS-Protection
  if echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
    print_pass "X-XSS-Protection header present"
  else
    print_info "X-XSS-Protection not set (modern browsers have built-in protection)"
  fi

  # Check Strict-Transport-Security
  if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
    print_pass "Strict-Transport-Security (HSTS) header present"
  else
    print_warn "Missing HSTS header"
  fi

  # Check Content-Security-Policy
  if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
    print_pass "Content-Security-Policy header present"
  else
    print_warn "Missing Content-Security-Policy header"
  fi

  # Check Referrer-Policy
  if echo "$HEADERS" | grep -qi "Referrer-Policy"; then
    print_pass "Referrer-Policy header present"
  else
    print_warn "Missing Referrer-Policy header"
  fi
}

# Run OWASP ZAP Scan
run_zap_scan() {
  print_header "Running OWASP ZAP Security Scan"

  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    print_fail "Docker not installed - skipping ZAP scan"
    return
  fi

  print_info "Starting ZAP baseline scan (this may take a few minutes)..."

  # Create output directory
  REPORT_DIR="./security-reports"
  mkdir -p "$REPORT_DIR"

  # Run ZAP baseline scan
  docker run --rm \
    --network host \
    -v "$(pwd)/${REPORT_DIR}:/zap/wrk:rw" \
    -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t "${BASE_URL}" \
    -r zap-report.html \
    -J zap-report.json \
    -I \
    --auto || true

  if [[ -f "${REPORT_DIR}/zap-report.html" ]]; then
    print_pass "ZAP scan complete - report saved to ${REPORT_DIR}/zap-report.html"
  else
    print_warn "ZAP scan completed but no report generated"
  fi
}

# Print summary
print_summary() {
  print_header "Security Test Summary"

  echo ""
  echo -e "  ${GREEN}Passed:${NC}   $PASSED"
  echo -e "  ${RED}Failed:${NC}   $FAILED"
  echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
  echo ""

  if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Security issues detected! Please review the failures above.${NC}"
    exit 1
  elif [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}Some warnings detected. Review recommended.${NC}"
  else
    echo -e "${GREEN}All security tests passed!${NC}"
  fi
}

# Show help
show_help() {
  echo "Security Testing Script for MFE Payments System"
  echo ""
  echo "Usage: ./scripts/security/security-test.sh [options]"
  echo ""
  echo "Options:"
  echo "  --quick       Run quick tests only (no ZAP scan)"
  echo "  --full        Run full test suite including ZAP scan"
  echo "  --zap-only    Run only ZAP scan"
  echo "  --help        Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  BASE_URL      Base URL of the application (default: https://localhost)"
  echo "  API_URL       API endpoint URL (default: https://localhost/api)"
  echo "  TEST_EMAIL    Test user email for auth tests"
  echo "  TEST_PASSWORD Test user password for auth tests"
}

# Main execution
main() {
  local RUN_QUICK=false
  local RUN_ZAP=false

  # Parse arguments
  case "${1:-}" in
    --quick)
      RUN_QUICK=true
      ;;
    --full)
      RUN_ZAP=true
      ;;
    --zap-only)
      check_prerequisites
      run_zap_scan
      exit 0
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    "")
      RUN_QUICK=true  # Default to quick
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac

  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║           MFE Payments System - Security Testing Suite                       ║${NC}"
  echo -e "${BLUE}║                        Phase 7: Session & Auth Hardening                     ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"

  check_prerequisites

  # Run all quick tests
  test_cookie_security
  test_session_fingerprinting
  test_token_storage
  test_csrf_protection
  test_rate_limiting
  test_security_headers

  # Run ZAP if requested
  if [[ "$RUN_ZAP" == "true" ]]; then
    run_zap_scan
  fi

  print_summary
}

main "$@"
