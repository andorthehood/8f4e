# Sprite Generator Package

This package generates sprite sheets for the 8f4e editor, including fonts, icons, and UI elements.

## Font Bitmaps

Font bitmaps are precomputed from ASCII art sources and bundled as Base64-encoded payloads to reduce bundle size and eliminate runtime conversion overhead.

### Editing Fonts

Font glyphs are defined as ASCII art in the source files:

- `src/fonts/8x16/ascii.ts` - 8x16 ASCII character font
- `src/fonts/8x16/glyphs.ts` - 8x16 custom glyphs for UI elements
- `src/fonts/6x10/ascii.ts` - 6x10 ASCII character font
- `src/fonts/6x10/glyphs.ts` - 6x10 custom glyphs for UI elements

Each glyph is an array of strings where:
- `' '` (space) represents an unset pixel
- `'#'` represents a set pixel

Example:
```typescript
[ // Character 'A'
	'   #    ',
	'  ###   ',
	' ## ##  ',
	'##   ## ',
	'####### ',
	'##   ## ',
	'##   ## ',
]
```

### Regenerating Font Bitmaps

Font bitmaps are automatically regenerated as part of the build process. However, you can manually regenerate them:

```bash
# From the sprite-generator package directory
node tools/generate-font-bitmaps.mjs

# Or using Nx
npx nx run sprite-generator:generate-fonts
```

Generated files are located in:
- `src/fonts/8x16/generated/`
- `src/fonts/6x10/generated/`

These files are git-ignored and should not be committed.

### How It Works

1. **Build Time**: The `generate-font-bitmaps.mjs` tool reads ASCII art font definitions and converts them to numeric bitmaps.
2. **Encoding**: Numeric bitmaps are encoded as Base64 strings with metadata (character dimensions, glyph count).
3. **Runtime**: The `font-decoder.ts` utility decodes Base64 payloads back to numeric arrays for rendering.

This approach reduces the production bundle size by ~90% compared to shipping ASCII art sources.

## Development

```bash
# Build the package
npx nx run sprite-generator:build

# Run tests
npx nx run sprite-generator:test

# Type check
npx nx run sprite-generator:typecheck

# Development mode with watch
npx nx run sprite-generator:dev
```

## Visual Regression Testing

The sprite generator includes Playwright-driven screenshot tests to ensure visual consistency and catch rendering regressions early.

### Prerequisites

Before running screenshot tests, ensure the sprite-generator package is built:

```bash
# Build the package (required for Vite aliases to resolve)
npx nx run sprite-generator:build
```

### Running Screenshot Tests

```bash
# Run all screenshot tests
npx nx run sprite-generator:test:screenshot

# Run with UI mode for debugging
npx nx run sprite-generator:test:screenshot:ui

# Run in headed mode (visible browser)
npx nx run sprite-generator:test:screenshot:headed

# Debug tests step-by-step
npx nx run sprite-generator:test:screenshot:debug
```

### Updating Snapshots

When sprite rendering changes are intentional (e.g., new features or bug fixes), update the baseline snapshots:

```bash
# Update all snapshots
npx nx run sprite-generator:test:screenshot:update
```

### Test Structure

Screenshot tests are located in `screenshot-tests/`:
- `screenshot.test.ts` - Main Playwright test file
- `test-cases/` - HTML and TypeScript files for each test scenario
- `screenshot.test.ts-snapshots/` - Baseline snapshot images (committed to git)
- `vite.config.ts` - Vite configuration for the test server (port 3002)

### Test Cases

Current test scenarios include:
- **sprite-sheet-with-8x16-font** - Default 8x16 font with standard color scheme
- **sprite-sheet-with-6x10-font** - 6x10 font with custom vibrant color scheme

### Adding New Test Cases

1. Create a new HTML file in `screenshot-tests/test-cases/` (e.g., `my-test.html`)
2. Create a corresponding TypeScript file (e.g., `my-test.ts`)
3. Add the test case name to the `testCases` array in `screenshot.test.ts`
4. Run `npm run test:screenshot:update` to capture the baseline snapshot

### CI Integration

Screenshot tests run automatically in CI. If a test fails:
1. Review the diff in the CI output
2. If the change is intentional, update snapshots locally and commit
3. If the change is unintentional, fix the rendering issue

## Bundle Size

Font bitmaps before optimization: ~79KB
Font bitmaps after optimization: ~8KB (90% reduction)
