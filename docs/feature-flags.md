# Feature Flags Configuration Documentation

The feature flags system allows you to enable/disable specific editor functionality during editor instantiation.

## Available Feature Flags

- `contextMenu: boolean` - Enable/disable right-click context menu functionality
- `infoOverlay: boolean` - Enable/disable info overlay display (development information)  
- `moduleDragging: boolean` - Enable/disable dragging and repositioning of code block modules
- `viewportDragging: boolean` - Enable/disable panning/scrolling of the editor viewport
- `localStorage: boolean` - Enable/disable localStorage functionality
- `editing: boolean` - Enable/disable all editing functionality (create, edit, delete, save)

## Usage Examples

### Basic Usage - All Features Enabled (Default)

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {});
// All features are enabled by default
```

### Disable Specific Features

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    contextMenu: false,      // Disable right-click context menu
    moduleDragging: false,   // Disable module dragging
    // Other features remain enabled
  }
});
```

### Disable All Editing

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    editing: false,          // Disable all editing functionality
    // All other features remain enabled (context menu, dragging, etc.)
  }
});
```

### View-Only Mode

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    editing: false,             // Disable all editing functionality
    contextMenu: false,         // Disable context menus
    moduleDragging: false,      // Disable module dragging
    // viewportDragging, infoOverlay and localStorage remain enabled for navigation
  }
});
```

### Complete View-Only Mode (No Interaction)

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    editing: false,             // Disable all editing functionality
    contextMenu: false,         // Disable context menus
    moduleDragging: false,      // Disable module dragging
    viewportDragging: false,    // Disable viewport panning
    // infoOverlay and localStorage remain enabled
  }
});
```

### Presentation Mode

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    contextMenu: false,
    infoOverlay: false,      // Hide development information
    moduleDragging: false,
    // viewportDragging and localStorage remain enabled for navigation
  }
});
```

### Completely Locked Editor

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    contextMenu: false,
    infoOverlay: false,
    moduleDragging: false,
    viewportDragging: false,
    localStorage: false,
  }
});
```

## Backward Compatibility

The system maintains full backward compatibility with existing options:

```typescript
// Legacy usage still works
const state = init(events, project, {
  showInfoOverlay: false,
  isLocalStorageEnabled: false,
});

// Feature flags take precedence over legacy options
const state = init(events, project, {
  showInfoOverlay: true,         // Legacy option
  isLocalStorageEnabled: true,   // Legacy option
  featureFlags: {
    infoOverlay: false,          // This overrides showInfoOverlay
    localStorage: false,         // This overrides isLocalStorageEnabled
  }
});
```

## Security Considerations

- Feature flags are immutable after editor instantiation for security
- Flags should be configured during setup phase and then locked
- Disabling features provides graceful degradation - no errors occur when disabled features are accessed

## Type Safety

The feature flags system is fully type-safe with TypeScript:

```typescript
import { FeatureFlagsConfig } from '@8f4e/editor';

const config: FeatureFlagsConfig = {
  contextMenu: false,
  // TypeScript will provide autocomplete and type checking
};
```