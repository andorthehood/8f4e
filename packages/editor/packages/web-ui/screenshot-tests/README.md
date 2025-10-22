# Web-UI Screenshot Tests

This directory contains visual regression tests for the `@8f4e/web-ui` package using Playwright.

## Overview

Screenshot tests help ensure that the visual rendering of the web-ui package remains consistent across changes. They capture images of the rendered output and compare them against baseline images to detect visual regressions.

## Test Structure

- `*-snapshots/` - Baseline images for comparison (one folder per test file)
- `*.spec.ts` - Test files

## Running Tests

### Run all screenshot tests
```bash
npm run test:screenshot
```

### Update baseline images (when UI changes are intentional)
```bash
npm run test:screenshot:update
```

### Run tests in headed mode (see browser)
```bash
npm run test:screenshot:headed
```

### Run tests with UI mode
```bash
npm run test:screenshot:ui
```

### Debug tests
```bash
npm run test:screenshot:debug
```

## Test Categories

### Web-UI Screenshot Tests (`web-ui-integration.spec.ts`)
- Simple hello world text display

## Adding New Tests

1. Create a new test file: `my-feature.spec.ts`
2. Import Playwright utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Use `page.setContent()` to create HTML content
4. Use `expect(page).toHaveScreenshot('filename.png')` to take screenshots

## Baseline Management

- Baseline images are automatically created on first run
- Update baselines using `npm run test:screenshot:update` when UI changes are intentional
- Baselines are stored in `*-snapshots/` folders (one per test file)
- **Note**: Snapshot folders are gitignored to avoid committing binary files without git-lfs
- For team collaboration, consider using git-lfs or sharing snapshots through other means
- Review baseline changes carefully before updating

## Configuration

Tests are configured in `playwright.config.ts`:
- Test directory: `./screenshot-tests`
- Browser: Chromium only (for consistency and speed)
- Screenshot threshold: 0.2 (20% pixel difference tolerance)

## Troubleshooting

### Tests failing due to minor visual differences
- Check if the differences are intentional
- Update baselines if changes are expected
- Adjust threshold in test options if needed

### Canvas not rendering properly
- Ensure WebGL context is available
- Check for proper canvas initialization
- Verify test fixtures are loading correctly

### Baseline images not updating
- Delete the existing baseline image
- Re-run the test to generate new baseline
- Commit the new baseline to version control

## Team Collaboration

Since snapshot images are gitignored, team members need to generate their own baselines:

1. **First time setup**: Run `npm run test:screenshot:update` to generate initial snapshots
2. **After UI changes**: Run `npm run test:screenshot:update` to update baselines
3. **For CI/CD**: Consider using git-lfs or storing snapshots in a shared location

## CI Integration

Screenshot tests are designed to run in CI environments:
- Headless mode by default
- Retry failed tests up to 2 times
- Generate HTML reports for failed tests
- Store test artifacts for review
- **Note**: CI will need baseline images to be available (consider git-lfs or artifact storage)
