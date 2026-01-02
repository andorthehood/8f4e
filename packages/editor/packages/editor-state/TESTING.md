# Testing Utilities

The `@8f4e/editor-state` package exports testing utilities that can be used in tests for this package and other packages. These utilities are **framework-agnostic** and work with any testing framework (Vitest, Jest, Playwright, etc.).

## Usage

Import the testing utilities using the `/testing` sub-path export:

```typescript
import {
  createMockState,
  createMockCodeBlock,
  createMockViewport,
  createMockEventDispatcher,
} from '@8f4e/editor-state/testing';
```

## Example: Using in web-ui tests

```typescript
// Works with any testing framework (Vitest, Playwright, Jest, etc.)
import { createMockState, createMockCodeBlock } from '@8f4e/editor-state/testing';

describe('MyComponent', () => {
  it('should render with mock state', () => {
    const state = createMockState({
      compiler: { compilationTime: 120 }
    });
    
    const block = createMockCodeBlock({ x: 100, y: 200, width: 150, height: 150 });
    
    // Use state and block in your tests...
  });
});
```

## Available Utilities

### createMockCodeBlock

Create mock CodeBlockGraphicData objects using an options object:

```typescript
// Basic usage with defaults
const block = createMockCodeBlock();

// Specify position and dimensions
const block = createMockCodeBlock({ x: 100, y: 200, width: 150, height: 150 });

// With ID and code
const block = createMockCodeBlock({ 
  id: 'my-block', 
  x: 100, 
  y: 200,
  code: ['test code']
});

// Use cursorY convenience parameter
const block = createMockCodeBlock({ 
  id: 'my-block', 
  x: 100, 
  y: 200, 
  cursorY: 75 
});
```

### createMockViewport

Create mock Viewport objects:

```typescript
const viewport = createMockViewport(); // { x: 0, y: 0 }
const viewport = createMockViewport(100, 200); // { x: 100, y: 200 }
const viewport = createMockViewport(100, 200, 500); // with animation duration
```

### createMockEventDispatcher

Create a mock EventDispatcher with no-op functions (framework-agnostic):

```typescript
const events = createMockEventDispatcher();

// All methods are simple no-op functions that work with any testing framework
// You can wrap them with your framework's spy/mock utilities if needed
```

### createMockState

Create comprehensive State objects with sensible defaults:

```typescript
const state = createMockState(); // Uses all defaults

const state = createMockState({
  compiler: {
    compilationTime: 120,
    codeBuffer: new Uint8Array([1, 2, 3]) 
  }
});
```

The `createMockState` function uses deep merging, so you only need to specify the properties you want to override.
