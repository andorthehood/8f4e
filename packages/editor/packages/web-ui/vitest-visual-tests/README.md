# Vitest Visual Regression Testing

This directory contains visual regression tests using Vitest browser mode with Playwright provider.

## Overview

This implementation demonstrates a unified testing approach where visual regression tests use the same Vitest runner as unit tests, replacing the need for separate Playwright-only tooling.

### Benefits over Playwright-only approach

- **Unified testing stack**: Same runner (Vitest) for both unit and visual tests
- **Shared utilities**: Test fixtures, mocks, and helpers can be reused
- **Consistent configuration**: Single configuration system across all test types
- **Simplified CI**: No need to orchestrate multiple test runners

## Running Visual Tests

### Locally

```bash
# Run visual tests
npm run visual-test
# or via Nx
nx visual-test @8f4e/web-ui

# Update baseline screenshots (when intentional changes are made)
npx vitest --config=vitest.visual.config.ts --run --update
```

### CI Integration

Visual tests are **opt-in** and do NOT run by default in CI pipelines to control costs. To run them in CI, you can:

1. Manually trigger a workflow that includes visual tests
2. Add them to pre-release checks
3. Run them on-demand via GitHub Actions workflow_dispatch

## Screenshot Storage

- Baseline snapshots: `vitest-visual-tests/__snapshots__/`
- Screenshots on failure: `vitest-visual-tests/__screenshots__/`
- Filenames do NOT include platform-specific suffixes since rendering is controlled in the browser

## Configuration

The visual test configuration is in `vitest.visual.config.ts`:

- Browser: Chromium only (via Playwright provider)
- Headless mode: Enabled for both local and CI
- Screenshot failures: Automatically captured for debugging

## Writing Visual Tests

Visual tests follow standard Vitest syntax with the browser mode `page` object:

```typescript
import { test, expect } from 'vitest';
import { page } from '@vitest/browser/context';

test('should render something', async () => {
  // Create and render to canvas
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  // ... render something ...
  
  // Take screenshot and compare
  await expect(page.screenshot()).resolves.toMatchSnapshot('my-test.png');
  
  // Cleanup
  document.body.removeChild(canvas);
});
```

## Future Enhancements

- [ ] Extract shared rendering utilities for 2D engine tests
- [ ] Add performance benchmarking for rendering operations
- [ ] Consider Git LFS for large screenshot suites
- [ ] Create visual tests for actual glugglug 2D engine scenes (once glugglug submodule workflow is established)

## Related Documentation

- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Vitest Visual Regression Testing](https://vitest.dev/guide/browser/visual-regression-testing.html)
- TODO-101: Use Vitest for Screenshot-Based Visual Regression Testing
- TODO-048: Add 2D Engine Visual Regression Tests
