# Editor Package Testing Guide

This guide provides comprehensive documentation for testing in the `@8f4e/editor` package, including the test utilities and best practices.

## Test Infrastructure Overview

The editor package includes a comprehensive test utilities framework located in `src/__tests__/` that provides:

- **Common test utilities** (`utils/`) - Shared helper functions and assertion utilities
- **Mock implementations** (`mocks/`) - Consistent mocks for external dependencies  
- **Test data factories** (`fixtures/`) - Easy creation of complex test data
- **Enhanced Jest configuration** - Optimized testing environment
- **Custom matchers** - Editor-specific Jest matchers

## Quick Start

### Importing Test Utilities

```typescript
// Import everything from the main index
import { createTestState, createMockEventDispatcher, assertValidState } from './__tests__';

// Or import specific categories
import { createTestState } from './__tests__/fixtures';
import { createMockEventDispatcher } from './__tests__/mocks';
import { assertValidState } from './__tests__/utils';
```

### Basic Test Setup

```typescript
import { createTestState, createMockEventDispatcher } from './__tests__';

describe('My Feature', () => {
  let mockState: State;
  let mockEvents: EventDispatcher;

  beforeEach(() => {
    mockState = createTestState();
    mockEvents = createMockEventDispatcher();
  });

  test('should work correctly', () => {
    // Your test logic here
    expect(mockState).toBeDefined();
  });
});
```

## Test Utilities Reference

### State Factories (`fixtures/stateFactory.ts`)

#### `createTestState(overrides?: Partial<State>): State`
Creates a complete test state object with sensible defaults.

```typescript
// Basic usage
const state = createTestState();

// With overrides
const state = createTestState({
  project: { title: 'Custom Project' },
  featureFlags: { editing: false },
});
```

#### Specialized State Factories

- `createCompilingState()` - State with compilation in progress
- `createStateWithErrors(errors)` - State with compilation errors
- `createStateWithProject(projectOverrides)` - State with custom project
- `createStateWithDisabledFeatures(disabledFeatures)` - State with disabled features

### Project Factories (`fixtures/projectFactory.ts`)

#### `createTestProject(overrides?: Partial<Project>): Project`
Creates a test project with default values.

```typescript
const project = createTestProject({
  title: 'My Test Project',
  codeBlocks: [createTestCodeBlock()],
});
```

#### Specialized Project Factories

- `createProjectWithCodeBlocks(blocks)` - Project with multiple code blocks
- `createProjectWithBinaryAssets(assets)` - Project with binary assets
- `createProjectWithRuntime(type, sampleRate)` - Project with specific runtime
- `createComplexTestProject()` - Complex project for integration testing

### Mock Implementations

#### Event Dispatcher Mocks (`mocks/eventDispatcher.ts`)

```typescript
// Simple mock with Jest functions
const mockEvents = createMockEventDispatcher();

// Functional mock that actually handles events
const functionalMock = createFunctionalMockEventDispatcher();

// Helper to trigger events in tests
triggerEvent(mockEvents, 'eventName', eventData);
```

#### WebAssembly Mocks (`mocks/webAssembly.ts`)

```typescript
// Mock WebAssembly.Memory
const memory = createMockWebAssemblyMemory(2); // 2 pages

// Mock WASM bytecode
const bytecode = createMockWasmBytecode(1024); // 1024 bytes

// Mock memory views
const views = createMockMemoryViews(memory);
```

#### Options Mocks (`mocks/options.ts`)

```typescript
// Full mock options with all callbacks
const options = createMockOptions();

// Minimal mock for simple tests
const options = createMinimalMockOptions();

// Custom overrides
const options = createMockOptions({
  compileProject: jest.fn().mockResolvedValue(customResult),
});
```

### Assertion Utilities (`utils/assertions.ts`)

```typescript
// Validate complex objects
assertValidState(state);
assertValidProject(project);
assertValidCompilerState(compilerState);
assertValidFeatureFlags(featureFlags);
assertValidWebAssemblyMemory(memory);
assertValidOptions(options);
```

### Test Helpers (`utils/testHelpers.ts`)

```typescript
// Console mocking
const { logSpy, warnSpy, restoreConsole } = setupConsoleMocks();
console.log('test');
expect(logSpy).toHaveBeenCalledWith('test');
restoreConsole();

// Test environment management
const test = withTestEnvironment(async (env) => {
  env.addCleanup(() => cleanup());
  // Your test logic
});

// Timer mocking
const { advanceTime, restoreTimers } = setupMockTimers();
advanceTime(1000);
restoreTimers();
```

## Custom Jest Matchers

The test setup includes custom matchers for editor-specific testing:

```typescript
// Check WebAssembly Memory validity
expect(memory).toBeValidWebAssemblyMemory();

// Check Project structure
expect(project).toHaveValidProjectStructure();
```

## Testing Patterns

### Testing State Effects

```typescript
import { createTestState, createMockEventDispatcher, triggerEvent } from './__tests__';

describe('State Effect', () => {
  test('should handle events correctly', async () => {
    const state = createTestState();
    const events = createMockEventDispatcher();
    
    // Set up the effect
    myEffect(state, events);
    
    // Trigger an event
    await triggerEvent(events, 'myEvent', { data: 'test' });
    
    // Assert state changes
    expect(state.someProperty).toBe('expected value');
  });
});
```

### Testing Compilation

```typescript
import { createStateWithErrors, createCompilingState } from './__tests__';

describe('Compilation', () => {
  test('should handle compilation errors', () => {
    const state = createStateWithErrors(['Error 1', 'Error 2']);
    
    expect(state.compiler.buildErrors).toHaveLength(2);
    expect(state.compiler.isCompiling).toBe(false);
  });

  test('should handle compilation in progress', () => {
    const state = createCompilingState();
    
    expect(state.compiler.isCompiling).toBe(true);
    expect(state.compiler.lastCompilationStart).toBeGreaterThan(0);
  });
});
```

### Testing with Complex Projects

```typescript
import { createComplexTestProject, createProjectWithCodeBlocks } from './__tests__';

describe('Project Features', () => {
  test('should handle complex projects', () => {
    const project = createComplexTestProject();
    
    expect(project.codeBlocks).toHaveLength(2);
    expect(project.binaryAssets).toHaveLength(2);
    expect(project.runtimeSettings).toHaveLength(2);
  });

  test('should handle nested code blocks', () => {
    const codeBlocks = [
      { code: ['parent'], codeBlocks: [{ code: ['child'] }] }
    ];
    const project = createProjectWithCodeBlocks(codeBlocks);
    
    expect(project.codeBlocks[0].codeBlocks).toHaveLength(1);
  });
});
```

### Testing Feature Flags

```typescript
import { createStateWithDisabledFeatures } from './__tests__';

describe('Feature Flags', () => {
  test('should respect disabled features', () => {
    const state = createStateWithDisabledFeatures({
      editing: false,
      moduleDragging: false,
    });
    
    expect(state.featureFlags.editing).toBe(false);
    expect(state.featureFlags.moduleDragging).toBe(false);
    expect(state.featureFlags.contextMenu).toBe(true); // Still enabled
  });
});
```

## Best Practices

### 1. Use Factories Over Manual Creation

❌ **Don't:** Manually create complex objects
```typescript
const state = {
  project: { title: '', codeBlocks: [], /* ... many fields */ },
  compiler: { isCompiling: false, /* ... many fields */ },
  // ... many more fields
};
```

✅ **Do:** Use factories with overrides
```typescript
const state = createTestState({
  project: { title: 'Test Project' },
  compiler: { isCompiling: true },
});
```

### 2. Use Assertions for Validation

❌ **Don't:** Manually check every property
```typescript
expect(state.project).toBeDefined();
expect(state.compiler).toBeDefined();
expect(state.options).toBeDefined();
// ... many more checks
```

✅ **Do:** Use assertion utilities
```typescript
assertValidState(state);
```

### 3. Prefer Functional Mocks for Event Testing

❌ **Don't:** Use simple mocks when testing event flow
```typescript
const events = createMockEventDispatcher();
// Can't easily trigger events or verify flow
```

✅ **Do:** Use functional mocks for event-driven tests
```typescript
const events = createFunctionalMockEventDispatcher();
await triggerEvent(events, 'myEvent', data);
```

### 4. Clean Up Resources

✅ **Do:** Use test environment for cleanup
```typescript
const test = withTestEnvironment(async (env) => {
  const resource = createResource();
  env.addCleanup(() => resource.destroy());
  
  // Test logic
});
```

### 5. Test at the Right Level

- **Unit tests**: Use minimal mocks and focused factories
- **Integration tests**: Use complex factories and functional mocks
- **End-to-end tests**: Use full state and minimal mocking

## Performance Considerations

- **Use `createMinimalMockOptions()` for simple tests** - Reduces setup overhead
- **Share mock instances when possible** - But be careful about state pollution
- **Use `setupMockTimers()` for time-dependent tests** - Faster than real timers
- **Leverage Jest's `clearMocks: true` configuration** - Automatic cleanup between tests

## Debugging Tests

### Console Output

```typescript
const { logSpy, restoreConsole } = setupConsoleMocks();

// Your test logic

// Check what was logged
console.log('Debug info:', logSpy.mock.calls);

restoreConsole();
```

### State Inspection

```typescript
// Use assertion utilities for detailed validation
try {
  assertValidState(state);
} catch (error) {
  console.log('State validation failed:', error);
  console.log('Current state:', JSON.stringify(state, null, 2));
}
```

## Contributing New Utilities

When adding new test utilities:

1. **Place in the appropriate directory** (`utils/`, `mocks/`, or `fixtures/`)
2. **Add comprehensive JSDoc comments**
3. **Export from the category index file**
4. **Write tests for the utility itself**
5. **Update this documentation**
6. **Consider reusability across packages**

## Configuration

The Jest configuration includes several optimizations for editor testing:

- **Coverage thresholds**: 80% for all metrics
- **Custom matchers**: Editor-specific assertions
- **Performance optimizations**: 50% max workers, caching enabled
- **Path ignoring**: Test utilities excluded from test runs
- **Enhanced setup**: Global mocks and custom matchers

See `jest.config.js` for the full configuration.