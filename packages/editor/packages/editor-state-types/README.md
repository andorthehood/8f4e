# @8f4e/editor-state-types

Shared type definitions for the 8f4e editor ecosystem. This package provides type definitions that are used across multiple packages to avoid circular dependencies.

## Overview

The `@8f4e/editor-state-types` package exports TypeScript type definitions for:

- **State**: The complete editor state interface
- **CodeBlockGraphicData**: Visual representation data for code blocks
- **Project**: Project structure and configuration
- **Callbacks**: Interface for editor callbacks
- **Runtime types**: Runtime factory and runtime type definitions
- **Feature flags**: Editor feature configuration types
- And many other shared types...

## Purpose

This package was created to break circular dependencies between:
- `@8f4e/editor`: The main editor package
- `@8f4e/web-ui`: The canvas rendering layer

By extracting shared types into this package, both the editor and web-ui can import the same type definitions without creating a circular dependency in the build graph.

## Architecture

The types are organized into several modules:

- **types.ts**: Core state and data structure types
- **featureFlags.ts**: Feature flag configuration types
- **runtime.ts**: Runtime factory and type definitions
- **eventDispatcher.ts**: Event dispatcher interface

## Dependencies

- `@8f4e/compiler`: For compiler-related types
- `@8f4e/sprite-generator`: For sprite and font types
- `glugglug`: For rendering engine types

## Usage

Import types from this package in your code:

```typescript
import type { State, CodeBlockGraphicData } from '@8f4e/editor-state-types';

function myFunction(state: State) {
  // Your code here
}
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

