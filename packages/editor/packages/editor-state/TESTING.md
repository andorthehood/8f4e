# Testing Utilities

The `@8f4e/editor-state` package exports testing utilities that can be used in tests for this package and other packages.

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
// In packages/editor/packages/web-ui/src/some.test.ts
import { createMockState, createMockCodeBlock } from '@8f4e/editor-state/testing';

describe('MyComponent', () => {
  it('should render with mock state', () => {
    const state = createMockState({
      projectInfo: { title: 'Test Project' }
    });
    
    const block = createMockCodeBlock(100, 200, 150, 150);
    
    // Use state and block in your tests...
  });
});
```

## Available Utilities

### createMockCodeBlock

Create mock CodeBlockGraphicData objects with flexible calling patterns:

```typescript
// Object-based (recommended for complex scenarios)
const block = createMockCodeBlock({ 
  id: 'my-block', 
  x: 100, 
  y: 200,
  code: ['test code']
});

// Positional (x, y)
const block = createMockCodeBlock(100, 200);

// With ID
const block = createMockCodeBlock('custom-id', 100, 200, 150, 150);
```

### createMockViewport

Create mock Viewport objects:

```typescript
const viewport = createMockViewport(); // { x: 0, y: 0 }
const viewport = createMockViewport(100, 200); // { x: 100, y: 200 }
const viewport = createMockViewport(100, 200, 500); // with animation duration
```

### createMockEventDispatcher

Create a mock EventDispatcher with vi.fn() stubs:

```typescript
const events = createMockEventDispatcher();

// All methods are mocked with vi.fn()
expect(events.on).toHaveBeenCalledWith('eventName', expect.any(Function));
```

### createMockState

Create comprehensive State objects with sensible defaults:

```typescript
const state = createMockState(); // Uses all defaults including a default color scheme

const state = createMockState({
  projectInfo: { title: 'My Project' },
  compiler: { 
    codeBuffer: new Uint8Array([1, 2, 3]) 
  }
});

// Override color schemes
const state = createMockState({
  colorSchemes: {
    custom: {
      text: { code: '#00ff00', ... },
      fill: { background: '#000000', ... },
      icons: { arrow: '#ffffff', ... }
    }
  }
});
```

The `createMockState` function uses deep merging, so you only need to specify the properties you want to override. It includes a comprehensive default color scheme that can be customized by passing overrides.
