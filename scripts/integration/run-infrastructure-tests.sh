#!/bin/bash
# Run Infrastructure Integration Tests
#
# This script runs comprehensive integration tests for POC-3 infrastructure.
# It requires infrastructure to be running (docker-compose up -d) and optionally
# backend services and frontend MFEs.
#
# Usage: ./scripts/integration/run-infrastructure-tests.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Running Infrastructure Integration Tests ===${NC}"
echo ""

# Check if infrastructure is running
echo -e "${YELLOW}Checking infrastructure status...${NC}"
if ! docker-compose ps | grep -q "Up"; then
  echo -e "${RED}⚠ Warning: Docker containers may not be running${NC}"
  echo -e "${YELLOW}  Run 'docker-compose up -d' to start infrastructure${NC}"
  echo ""
fi

# Check if required dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! command -v tsx &> /dev/null; then
  echo -e "${RED}✗ tsx not found. Installing...${NC}"
  pnpm add -D tsx
fi

# Run the integration tests
echo -e "${YELLOW}Running integration tests...${NC}"
echo ""

pnpm tsx scripts/integration/infrastructure-integration.test.ts

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All infrastructure integration tests passed!${NC}"
else
  echo -e "${RED}✗ Some infrastructure integration tests failed${NC}"
fi

exit $EXIT_CODE
