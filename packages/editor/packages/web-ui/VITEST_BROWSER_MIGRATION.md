# Vitest Browser Mode Screenshot Testing - Migration Notes

## Summary

This document tracks the attempt to migrate the existing Playwright-based screenshot tests to Vitest browser mode, as specified in TODO #101.

## Changes Made

###  Dependencies Upgraded
- ✅ Upgraded Vitest from 3.2.4 to 4.0.13
- ✅ Installed `@vitest/browser@4.0.13`
- ✅ Installed `@vitest/browser-playwright@4.0.13`
- ✅ Upgraded Nx packages (@nx/vite, @nx/js) to 22.1.1 for Vitest v4 compatibility
- ✅ Updated all project.json files to use `@nx/vitest:test` executor (deprecated executor warning)
- ✅ Installed Playwright Chromium browser

### Configuration Created
- ✅ Created `vitest.browser.config.ts` with Playwright provider
- ✅ Configured Chromium browser instance with headless mode
- ✅ Added `test:visual` target to `project.json`

### Test Migration
- ✅ Created `screenshot-vitest.test.ts` with migrated test logic
- ✅ Extracted test case initialization functions to avoid relying on HTML file navigation
- ✅ Adapted tests to work within Vitest browser environment

## Current Blocker

**Vitest browser mode consistently hangs during test execution**, preventing the tests from running. The issue manifests as:

1. The Vitest runner starts successfully
2. It detects the browser configuration
3. It attempts to launch Chromium  
4. The process hangs indefinitely without executing tests or timing out gracefully

### Root Cause Investigation

Several issues were encountered and resolved:
1. ❌ **Initial**: Missing browser dependencies → ✅ Installed Playwright browsers
2. ❌ **Configuration**: Old API (`provider: 'playwright'`) → ✅ Updated to use factory function
3. ❌ **Configuration**: Missing `browser.instances` → ✅ Added instances configuration
4. ❌ **Environment**: X server error in headless environment → ✅ Added headless launch options

### Remaining Issue

Despite all configuration fixes, tests still hang. Possible causes:
- **Vit est v4.0.13 browser mode may have stability issues** in CI/headless environments
- **Playwright provider integration** may require additional configuration not yet documented
- **Resource constraints** or environment-specific issues in the sandboxed test environment

## Alternative Approaches Considered

1. **Use xvfb-run**: Tested but still hangs
2. **Different browser args**: Added `--no-sandbox`, `--disable-gpu`, etc. - still hangs
3. **Simplify test**: Even minimal tests (`expect(1+1).toBe(2)`) hang

## Recommendations

### Option 1: Continue with Vitest v4 (High Effort)
- Deep dive into Vitest v4 browser mode internals
- Check for known issues in Vitest GitHub repo
- Try alternative browser providers (webdriverio)
- May require waiting for Vitest v4 browser mode to mature

### Option 2: Downgrade to Vitest v3 (Medium Effort)
- Vitest v3 had browser mode support (experimental)
- May be more stable but with fewer features
- Would not meet "latest version" requirement from TODO

### Option 3: Keep Playwright for Screenshot Tests (Low Effort, Pragmatic)
- Keep existing Playwright tests working
- Use Vitest for unit/integration tests only
- Document that visual regression tests use dedicated tooling
- Aligns with industry practice (many projects use separate tools for visual regression)
- Revisit Vitest browser mode when v4+ is more mature

## Files Created/Modified

- `packages/editor/packages/web-ui/vitest.browser.config.ts` - Browser mode configuration
- `packages/editor/packages/web-ui/screenshot-tests/screenshot-vitest.test.ts` - Migrated tests
- `packages/editor/packages/web-ui/screenshot-tests/minimal.test.ts` - Debug test
- `packages/editor/packages/web-ui/project.json` - Added `test:visual` target
- `package.json` - Updated dependencies to v4
- Multiple `project.json` files - Updated executor from `@nx/vite:test` to `@nx/vitest:test`

## Next Steps

**Decision needed**: Which option to pursue?

The pragmatic path (Option 3) would allow the project to:
- Keep existing screenshot tests working via Playwright
- Benefit from Vitest v4 for unit/integration tests  
- Revisit visual regression migration when Vitest browser mode is more mature
- Focus development effort on features rather than tooling migration

