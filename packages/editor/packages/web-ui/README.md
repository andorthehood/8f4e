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
npx nx run web-ui:build
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Development

```bash
npx nx run web-ui:dev
```

Runs TypeScript in watch mode for development.
