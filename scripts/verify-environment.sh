#!/bin/bash

# Environment Verification Script for POC-0
# Verifies that all prerequisites are met before starting implementation

set -e

echo "🔍 Verifying POC-0 Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check version
check_version() {
    local tool=$1
    local required=$2
    local actual=$3
    
    if [ "$actual" = "$required" ] || [ "$(printf '%s\n' "$required" "$actual" | sort -V | head -n1)" = "$required" ]; then
        echo -e "${GREEN}✅${NC} $tool: $actual (required: $required)"
        return 0
    else
        echo -e "${RED}❌${NC} $tool: $actual (required: $required)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check if command exists
check_command() {
    local cmd=$1
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $cmd is installed"
        return 0
    else
        echo -e "${RED}❌${NC} $cmd is NOT installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    NODE_MINOR=$(echo $NODE_VERSION | cut -d. -f2)
    
    if [ "$NODE_MAJOR" -ge 24 ] && [ "$NODE_MINOR" -ge 11 ]; then
        echo -e "${GREEN}✅${NC} Node.js: $NODE_VERSION (required: 24.11.x LTS)"
    else
        echo -e "${RED}❌${NC} Node.js: $NODE_VERSION (required: 24.11.x LTS)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} Node.js is NOT installed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check pnpm
echo "📦 Checking pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    PNPM_MAJOR=$(echo $PNPM_VERSION | cut -d. -f1)
    
    if [ "$PNPM_MAJOR" -ge 9 ]; then
        echo -e "${GREEN}✅${NC} pnpm: $PNPM_VERSION (required: 9.x)"
    else
        echo -e "${RED}❌${NC} pnpm: $PNPM_VERSION (required: 9.x)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} pnpm is NOT installed"
    echo -e "${YELLOW}💡${NC} Install with: npm install -g pnpm@9"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Git
echo "📦 Checking Git..."
check_command git
if command -v git &> /dev/null; then
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Git repository initialized"
    else
        echo -e "${YELLOW}⚠️${NC}  Git repository not initialized"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check TypeScript (if workspace exists)
echo "📦 Checking TypeScript..."
if [ -f "package.json" ]; then
    if command -v npx &> /dev/null; then
        if npx tsc --version &> /dev/null; then
            TS_VERSION=$(npx tsc --version | awk '{print $2}')
            echo -e "${GREEN}✅${NC} TypeScript: $TS_VERSION (required: 5.9.x)"
        else
            echo -e "${YELLOW}⚠️${NC}  TypeScript not installed (will be installed with dependencies)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠️${NC}  package.json not found (workspace not initialized yet)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check required files
echo "📄 Checking required files..."
REQUIRED_FILES=(
    ".cursorrules"
    "docs/POC-0-Implementation/implementation-plan.md"
    "docs/POC-0-Implementation/task-list.md"
    "docs/POC-0-Implementation/project-rules-cursor.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file exists"
    else
        echo -e "${RED}❌${NC} $file is MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check directory structure
echo "📁 Checking directory structure..."
if [ -d "docs" ]; then
    echo -e "${GREEN}✅${NC} docs/ directory exists"
else
    echo -e "${RED}❌${NC} docs/ directory is MISSING"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "docs/POC-0-Implementation" ]; then
    echo -e "${GREEN}✅${NC} docs/POC-0-Implementation/ directory exists"
else
    echo -e "${RED}❌${NC} docs/POC-0-Implementation/ directory is MISSING"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to start implementation.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  All critical checks passed, but $WARNINGS warning(s).${NC}"
    echo -e "${YELLOW}   You can proceed, but review warnings above.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before starting.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   Also $WARNINGS warning(s) to review.${NC}"
    fi
    exit 1
fi
