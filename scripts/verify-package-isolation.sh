#!/bin/bash
set -e

# Script to verify package configuration isolation
# This script ensures that packages don't reference files outside their boundaries

echo "Verifying package configuration isolation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

errors=0

# Check 1: No vitest.preset.ts imports in package configs
echo "Checking for vitest.preset.ts imports..."
if grep -r "from.*vitest\.preset" packages/*/vitest.config.ts packages/*/*/vitest.config.ts 2>/dev/null; then
    echo -e "${RED}ERROR: Found imports of vitest.preset.ts in package configs${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✓ No vitest.preset.ts imports found${NC}"
fi

# Check 2: No ../ paths escaping package boundaries in vite.config.ts files
echo "Checking for cross-package paths in vite.config.ts files..."
# Look for resolve(__dirname, '../../../') or similar patterns that escape the package
if grep -r "resolve(__dirname.*'\.\./\.\./\.\." packages/*/vite.config.ts packages/*/*/vite.config.ts packages/*/*/*/vite.config.ts 2>/dev/null; then
    echo -e "${RED}ERROR: Found cross-package path references in vite.config.ts files${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✓ No cross-package path references in vite.config.ts files${NC}"
fi

# Check 3: No package-lock.json files in workspace packages
echo "Checking for package-lock.json files in workspace packages..."
if find packages -name "package-lock.json" -type f | grep -q .; then
    echo -e "${RED}ERROR: Found package-lock.json files in workspace packages:${NC}"
    find packages -name "package-lock.json" -type f
    errors=$((errors + 1))
else
    echo -e "${GREEN}✓ No package-lock.json files in workspace packages${NC}"
fi

# Check 4: No file: references in package.json dependencies
echo "Checking for file: references in package.json files..."
if grep -r '"file:' packages/*/package.json 2>/dev/null; then
    echo -e "${RED}ERROR: Found file: references in package.json dependencies${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✓ No file: references in package.json files${NC}"
fi

# Summary
echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}All package isolation checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Package isolation verification failed with $errors error(s)${NC}"
    exit 1
fi
