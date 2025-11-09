# @8f4e/web-ui

Canvas rendering package for the 8f4e editor. This package provides the WebGL-based 2D rendering engine integration for displaying the visual editor interface.

## Overview

The `@8f4e/web-ui` package is responsible for:

- Rendering code blocks, connections, and UI elements using the `glugglug` 2D engine
- Managing sprite sheets and textures for the editor
- Providing drawing functions for all visual elements (code blocks, context menus, dialogs, etc.)
- Handling post-process effects and caching for optimal rendering performance

## Architecture

This package was extracted from the `@8f4e/editor` package to separate rendering concerns from editor state management. It imports state types from `@8f4e/editor-state` to avoid circular dependencies in the build process.

### Key Components

- **index.ts**: Main entry point that initializes the rendering engine
- **drawers/**: Contains all the drawing functions for different UI elements
  - `codeBlocks/`: Code block rendering and related extras (buttons, switches, plotters, etc.)
  - `contextMenu.ts`: Context menu rendering
  - `dialog.ts`: Dialog rendering
  - `arrows.ts`: Connection arrows
  - `infoOverlay.ts`: Performance and debug information
- **textures/**: Static assets like cursor images

## Dependencies

- `glugglug`: 2D WebGL rendering engine
- `@8f4e/sprite-generator`: Generates sprite sheets for characters and UI elements
- `@8f4e/editor-state`: Provides type definitions and state management for the editor

## Usage

The package exports a single initialization function:

```typescript
import initView from '@8f4e/web-ui';
import type { State } from '@8f4e/editor';

const view = await initView(state, canvas);

// Resize the viewport
view.resize(width, height);

// Reload sprite sheet (e.g., after theme change)
view.reloadSpriteSheet();

// Load post-process effects
view.loadPostProcessEffects(effects);

// Clear rendering cache
view.clearCache();
```

## Build

```bash
npm run build
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Development

```bash
npm run dev
```

Runs TypeScript in watch mode for development.

## Testing

The package uses Vitest for unit tests and Playwright for screenshot tests.

### Running Tests

```bash
# Run unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run unit tests once (no watch mode)
npm run test:run

# Run screenshot tests
npm run test:screenshot

# Update screenshot baselines
npm run test:screenshot:update
```

### Writing Tests

When writing unit tests for web-ui components, use the testing utilities provided by `@8f4e/editor-state/testing`:

```typescript
import { createMockState, createMockCodeBlock, createMockViewport } from '@8f4e/editor-state/testing';

describe('MyFunction', () => {
  it('should work with mock state', () => {
    const state = createMockState({
      projectInfo: { title: 'Test Project' },
      featureFlags: { viewportAnimations: true }
    });
    
    const block = createMockCodeBlock(100, 200, 150, 150);
    const viewport = createMockViewport(0, 0, 300);
    
    // Use in your tests...
  });
});
```

#### Available Testing Utilities

- **`createMockState(overrides?)`** - Creates a complete State object with sensible defaults. Use partial overrides to customize specific properties.
- **`createMockCodeBlock(params)`** - Creates mock CodeBlockGraphicData. Supports object overrides or positional parameters (x, y, width, height).
- **`createMockViewport(x, y, animationDurationMs?)`** - Creates mock Viewport objects.
- **`createMockEventDispatcher()`** - Creates a mocked EventDispatcher with vi.fn() stubs.

For more details, see [@8f4e/editor-state/TESTING.md](../editor-state/TESTING.md).

### Test Organization

- Unit tests: Place `.test.ts` files next to the source files they test in `src/`
- Screenshot tests: Located in `screenshot-tests/` and run with Playwright
