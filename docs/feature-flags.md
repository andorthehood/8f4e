# Feature Flags Configuration Documentation

The feature flags system allows you to enable/disable specific editor functionality during editor instantiation.

## Available Feature Flags

- `contextMenu: boolean` - Enable/disable right-click context menu functionality
- `infoOverlay: boolean` - Enable/disable info overlay display (development information)  
- `consoleOverlay: boolean` - Enable/disable console overlay display (internal logging) (default: false)
- `moduleDragging: boolean` - Enable/disable dragging and repositioning of code block modules
- `viewportDragging: boolean` - Enable/disable panning/scrolling of the editor viewport
- `editing: boolean` - Enable/disable all editing functionality (create, edit, delete, save)
- `demoMode: boolean` - Enable/disable automatic demo mode with periodic code block navigation (default: false)

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
    // viewportDragging and infoOverlay remain enabled for navigation
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
    // infoOverlay remains enabled
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

### Demo Mode (Automatic Navigation)

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    demoMode: true,          // Enable automatic code block navigation
    editing: false,          // Disable editing during demo
    contextMenu: false,      // Disable context menu
    infoOverlay: false,      // Hide development information
    moduleDragging: false,   // Disable module dragging
    // viewportDragging remains enabled for manual navigation if needed
  }
});
```

Demo mode features:
- Automatically selects a random code block when the project loads
- Navigates between code blocks every 2 seconds in random directions
- Smoothly animates viewport transitions for a polished presentation
- Perfect for automated demos, presentations, or showcase displays

### Debug Mode (With Console Overlay)

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    consoleOverlay: true,   // Enable console overlay for debugging
    infoOverlay: true,      // Also show info overlay
    // Other features remain enabled
  }
});
```

Console overlay features:
- Displays internal editor logs on the right side of the screen
- Shows timestamped log entries with level indicators (log, warn, error, info)
- Uses color-coded backgrounds: red for errors, yellow/orange for warnings
- Automatically limits to 100 log entries (circular buffer)
- Truncates long messages to fit the screen width
- Perfect for debugging editor behavior without opening DevTools

### Completely Locked Editor

```typescript
import init from '@8f4e/editor';

const state = init(events, project, {
  featureFlags: {
    contextMenu: false,
    infoOverlay: false,
    moduleDragging: false,
    viewportDragging: false,
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