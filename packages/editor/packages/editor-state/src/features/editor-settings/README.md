# Editor Settings Feature

## Purpose

Manages editor-wide settings such as color scheme selection and persistence. Provides runtime updates for visual themes and coordinates with persistent storage callbacks.

## Key Behaviors

- **Color Scheme Management**: Maintains list of available color schemes and current selection
- **Persistent Storage**: Coordinates with storage callbacks for settings persistence
- **Runtime Updates**: Propagates settings changes through state updates

## Current Scope

- **Color Schemes**: List of available schemes with selection index
- Additional settings may be added in the future

## Events & Callbacks

### Callbacks Used

- Storage-related callbacks for persisting editor settings (implementation-specific)

### State Touched

- `state.editorSettings.colorSchemes` - Array of available color scheme definitions
- `state.editorSettings.selectedColorScheme` - Index of currently active color scheme

## Integration Points

- **UI Rendering**: Color scheme selection affects editor visual appearance
- **Persistent Storage**: Settings are saved/loaded through callback system
- **Runtime Updates**: Settings changes trigger visual updates in the editor

## Notes & Limitations

- Current implementation focuses on color schemes
- Settings persistence depends on external callbacks being provided
- Runtime updates are propagated through state manager subscriptions
