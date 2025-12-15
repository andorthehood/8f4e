# @8f4e/state-manager

A type-safe state manager with deep nesting support and subscription capabilities.

## Features

- **Type-safe**: Full TypeScript support with automatic type inference
- **Deep nesting**: Support for unlimited levels of nested object properties
- **Subscriptions**: Subscribe to specific state changes with type-safe callbacks
- **Cascading updates**: Parent selectors fire when nested values change, and child selectors fire when parents are replaced
- **Zero dependencies**: Lightweight implementation with no external dependencies

## Installation

```bash
npm install @8f4e/state-manager
```

## Usage

### Basic Usage

```typescript
import createStateManager from '@8f4e/state-manager';

interface AppState {
  user: {
    name: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
      preferences: {
        language: string;
        timezone: string;
        display: {
          fontSize: number;
          animations: boolean;
        };
      };
    };
  };
  items: string[];
}

const initialState: AppState = {
  user: {
    name: 'John Doe',
    settings: {
      theme: 'dark',
      notifications: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        display: {
          fontSize: 14,
          animations: true,
        },
      },
    },
  },
  items: ['item1', 'item2'],
};

const stateManager = createStateManager(initialState);
```

### Setting Values

```typescript
// Top-level properties
stateManager.set('items', ['new', 'items']);

// Nested properties (2 levels)
stateManager.set('user.name', 'Jane Doe');
stateManager.set('user.settings.theme', 'light');

// Deep nested properties (3+ levels)
stateManager.set('user.settings.preferences.language', 'es');
stateManager.set('user.settings.preferences.display.fontSize', 16);
stateManager.set('user.settings.preferences.display.animations', false);
```

### Subscribing to Changes

```typescript
// Subscribe to top-level changes
stateManager.subscribe('items', (newItems) => {
  console.log('Items updated:', newItems);
  // newItems is automatically typed as string[]
});

// Subscribe to nested changes
stateManager.subscribe('user.settings.theme', (theme) => {
  console.log('Theme changed to:', theme);
  // theme is automatically typed as 'light' | 'dark'
});

// Subscribe to deep nested changes
stateManager.subscribe('user.settings.preferences.display.fontSize', (fontSize) => {
  console.log('Font size changed to:', fontSize);
  // fontSize is automatically typed as number
});

// Parent subscriptions fire when descendants change
stateManager.subscribe('user.settings.preferences', (preferences) => {
  console.log('Preferences updated:', preferences);
});

// Child subscriptions fire when a parent object is replaced
stateManager.subscribe('user.settings.preferences.display.animations', (animations) => {
  console.log('Animations toggled:', animations);
});

// Replacing the parent notifies both parent and child subscribers
stateManager.set('user.settings.preferences.display', {
  fontSize: 24,
  animations: false,
  accessibility: initialState.user.settings.preferences.display.accessibility,
});

```

### Unsubscribing

```typescript
const onNameChanged = (name: string) => {
  console.log('Name changed:', name);
};

// Later, unsubscribe by selector + callback
stateManager.unsubscribe('user.name', onNameChanged);
```

### Getting State

```typescript
const currentState = stateManager.getState();
console.log(currentState.user.settings.theme); // 'dark'
```

## Type Safety

The state manager provides full type safety with automatic type inference:

```typescript
// ✅ These will compile with correct types
stateManager.set('user.name', 'John'); // string
stateManager.set('user.settings.notifications', true); // boolean
stateManager.set('user.settings.preferences.display.fontSize', 16); // number

// ❌ These will cause TypeScript errors
stateManager.set('user.name', 123); // Error: Type 'number' is not assignable to type 'string'
stateManager.set('user.settings.theme', 'invalid'); // Error: Type '"invalid"' is not assignable to type '"light" | "dark"'

// ✅ Callbacks have proper type inference
stateManager.subscribe('user.settings.preferences.language', (language) => {
  // language is automatically typed as string
  console.log(language.toUpperCase()); // No TypeScript error
});
```

## Deep Nesting Support

The state manager supports unlimited levels of nesting:

```typescript
interface DeepState {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              level7: {
                value: string;
              };
            };
          };
        };
      };
    };
  };
}

const stateManager = createStateManager<DeepState>(initialState);

// This works with full type safety
stateManager.set('level1.level2.level3.level4.level5.level6.level7.value', 'deep value');

stateManager.subscribe('level1.level2.level3.level4.level5.level6.level7.value', (value) => {
  // value is automatically typed as string
  console.log('Deep value changed:', value);
});
```

## API Reference

### `createStateManager<State>(initialState: State): StateManager<State>`

Creates a new state manager instance.

### `StateManager<State>`

#### `getState(): State`

Returns the current state.

#### `set<P extends Path<State>>(selector: P, value: PathValue<State, P>): void`

Updates a state property. The selector can be a top-level key or a dot-separated path for nested properties.

#### `subscribe<P extends Path<State>>(selector: P, callback: (value: PathValue<State, P>) => void): Subscription<State, P>`

Subscribes to changes on a specific state property. Returns a subscription object that can be used for unsubscribing.

#### `unsubscribe<P extends Path<State>>(subscription: Subscription<State, P>): void`

Unsubscribes from state changes.

## License

MIT
