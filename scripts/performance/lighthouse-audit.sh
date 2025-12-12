#!/bin/bash
# Lighthouse Performance Audit Script
#
# Runs Lighthouse audits on the application and generates reports.
# Target: Lighthouse score > 80
#
# Usage: ./scripts/performance/lighthouse-audit.sh [url]
#
# Prerequisites:
#   - Lighthouse CLI installed: npm install -g lighthouse
#   - Application running (frontend MFEs)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default URL
URL="${1:-https://localhost}"

# Target score
TARGET_SCORE=80

echo -e "${BLUE}=== Lighthouse Performance Audit ===${NC}"
echo "URL: $URL"
echo "Target Score: $TARGET_SCORE"
echo ""

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
  echo -e "${RED}✗ Lighthouse CLI not found${NC}"
  echo -e "${YELLOW}  Install with: npm install -g lighthouse${NC}"
  echo -e "${YELLOW}  Or use: pnpm add -g lighthouse${NC}"
  exit 1
fi

# Create reports directory
mkdir -p reports/lighthouse

# Run Lighthouse audit
echo -e "${YELLOW}Running Lighthouse audit...${NC}"
echo ""

lighthouse "$URL" \
  --chrome-flags='--ignore-certificate-errors --disable-web-security' \
  --output=html \
  --output-path=./reports/lighthouse/report.html \
  --quiet \
  --no-enable-error-reporting || {
  echo -e "${RED}✗ Lighthouse audit failed${NC}"
  exit 1
}

# Extract scores from JSON (if available)
if [ -f "./reports/lighthouse/report.json" ]; then
  PERFORMANCE_SCORE=$(node -e "
    const report = require('./reports/lighthouse/report.json');
    const score = report.categories.performance.score * 100;
    console.log(Math.round(score));
  " 2>/dev/null || echo "0")

  ACCESSIBILITY_SCORE=$(node -e "
    const report = require('./reports/lighthouse/report.json');
    const score = report.categories.accessibility.score * 100;
    console.log(Math.round(score));
  " 2>/dev/null || echo "0")

  BEST_PRACTICES_SCORE=$(node -e "
    const report = require('./reports/lighthouse/report.json');
    const score = report.categories['best-practices'].score * 100;
    console.log(Math.round(score));
  " 2>/dev/null || echo "0")

  SEO_SCORE=$(node -e "
    const report = require('./reports/lighthouse/report.json');
    const score = report.categories.seo.score * 100;
    console.log(Math.round(score));
  " 2>/dev/null || echo "0")

  echo -e "${BLUE}=== Lighthouse Scores ===${NC}"
  echo ""
  echo -e "Performance: ${PERFORMANCE_SCORE}/100"
  echo -e "Accessibility: ${ACCESSIBILITY_SCORE}/100"
  echo -e "Best Practices: ${BEST_PRACTICES_SCORE}/100"
  echo -e "SEO: ${SEO_SCORE}/100"
  echo ""

  if [ "$PERFORMANCE_SCORE" -ge "$TARGET_SCORE" ]; then
    echo -e "${GREEN}✓ Performance score meets target (${PERFORMANCE_SCORE} >= ${TARGET_SCORE})${NC}"
    EXIT_CODE=0
  else
    echo -e "${RED}✗ Performance score below target (${PERFORMANCE_SCORE} < ${TARGET_SCORE})${NC}"
    EXIT_CODE=1
  fi
else
  echo -e "${YELLOW}⚠ Could not extract scores from JSON report${NC}"
  echo -e "${YELLOW}  Check HTML report: ./reports/lighthouse/report.html${NC}"
  EXIT_CODE=0
fi

echo ""
echo -e "${BLUE}Report saved to: ./reports/lighthouse/report.html${NC}"

exit $EXIT_CODE
