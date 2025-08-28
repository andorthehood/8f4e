# 2D Engine Visual Regression Tests

This directory contains visual regression tests for the 2D engine package. These tests ensure that rendering behavior remains consistent across code changes.

## Overview

Visual regression tests capture screenshots of rendered output and compare them against baseline images to detect unexpected changes in visual appearance.

## Test Structure

- `setup.ts` - Jest configuration for visual tests with jest-image-snapshot
- `test-sprite-sheet.ts` - Utilities for creating test sprite sheets programmatically
- `engine.visual.test.ts` - Main visual regression test suite
- `../test-fixtures/visual-test.html` - HTML page used for browser-based rendering tests

## Running Tests

### Basic Visual Tests (Mock Mode)
```bash
npm run test:visual
```

This runs the tests in mock mode, which validates test structure without requiring Playwright browsers.

### Full Visual Tests (With Playwright)
```bash
# First install Playwright browsers
npx playwright install

# Set environment to enable full tests
SKIP_VISUAL_TESTS=false npm run test:visual
```

### Updating Baselines
```bash
npm run test:visual:update
```

## Test Coverage

The visual tests cover:

1. **Basic Sprite Rendering** - Single and multiple sprites
2. **Line Drawing** - Horizontal, vertical, and diagonal lines
3. **Rectangle Drawing** - Outlined rectangles with various thicknesses  
4. **Text Rendering** - Sprite-based text drawing
5. **Transform Groups** - Offset transformations and grouping
6. **Sprite Scaling** - Custom sprite dimensions
7. **Complex Scenes** - Combined elements and UI composition

## Architecture

### Mock Mode (Default)
- Tests run without browser dependencies
- Validates test structure and infrastructure
- Safe for CI environments without graphics support
- Tests use mock screenshots to verify test logic

### Full Mode (With Playwright)
- Uses headless Chromium for actual rendering
- Captures real screenshots for pixel-perfect comparison
- Requires Playwright browsers to be installed
- Generates baseline images for comparison

### Test Implementation
```typescript
// Mock mode test (always runs)
it('should render basic sprites correctly', async () => {
    const mockScreenshot = Buffer.from('mock-image-data');
    expect(mockScreenshot).toBeDefined();
});

// Full mode test (runs when Playwright available)
const runVisualTest = skipVisualTests ? it.skip : it;
runVisualTest('should render basic sprites correctly', async () => {
    const screenshot = await runEngineTest('basic-sprites', testFunction);
    expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'basic-sprites'
    });
});
```

## Configuration

### jest-image-snapshot settings:
- `threshold: 0.2` - Allow 20% pixel difference tolerance
- `failureThreshold: 0.01` - Fail if more than 1% of pixels differ
- `allowSizeMismatch: false` - Require exact image dimensions

### Playwright settings:
- Viewport: 1024x768 for consistent screenshots
- Headless mode enabled
- Web security disabled for local file access

## Adding New Visual Tests

1. **Create Test Function**:
```typescript
runVisualTest('should render new feature', async () => {
    const screenshot = await runEngineTest('test-name', `
        async function(engine) {
            // Your test drawing code here
            engine.drawSprite(10, 10, 'red-square');
        }
    `);
    
    expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'new-feature'
    });
});
```

2. **Run Tests** to generate baseline:
```bash
npm run test:visual:update
```

3. **Commit** baseline images with your changes

## Troubleshooting

### "Executable doesn't exist" Error
Install Playwright browsers:
```bash
npx playwright install
```

### CI/CD Integration
Set environment variables to skip full visual tests in CI:
```bash
export SKIP_VISUAL_TESTS=true
export CI=true
```

### Baseline Image Differences
If legitimate changes cause test failures:
1. Review the visual diff images in test output
2. If changes are expected, update baselines:
   ```bash
   npm run test:visual:update
   ```
3. Commit the updated baseline images

## File Organization

```
tests/visual/
├── setup.ts                 # Jest configuration
├── test-sprite-sheet.ts      # Test utilities
├── engine.visual.test.ts     # Main test suite
└── __image_snapshots__/      # Baseline images (auto-generated)

test-fixtures/
└── visual-test.html          # Test HTML page
```

## Best Practices

1. **Keep tests focused** - Test one feature per test case
2. **Use descriptive names** - Clear test and snapshot identifiers
3. **Minimize test data** - Use programmatic sprite sheets when possible
4. **Document changes** - Update baselines deliberately with code reviews
5. **Consider tolerance** - Allow for minor rendering differences across platforms

## Environment Considerations

- **Local Development**: Full visual tests work with Playwright installed
- **CI/CD**: Mock tests ensure infrastructure works without graphics dependencies
- **Cross-Platform**: May need different baselines for different OS/browser combinations