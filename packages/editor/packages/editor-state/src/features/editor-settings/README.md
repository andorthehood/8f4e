# Editor Settings Feature

## Purpose

Manages editor-wide settings such as color scheme selection and font preferences. Settings can be configured either through traditional persistence (callbacks) or through `config editor` blocks that use the stack-config language. Provides runtime updates for visual themes and coordinates with persistent storage callbacks.

## Key Behaviors

- **Color Scheme Management**: Maintains list of available color schemes and current selection
- **Font Configuration**: Supports multiple font sizes ('6x10' and '8x16')
- **Persistent Storage**: Coordinates with storage callbacks for settings persistence
- **Runtime Updates**: Propagates settings changes through state updates
- **Config Block Support**: Compiles and applies `config editor` blocks to settings

## Config Editor Blocks

Editor settings can be configured using `config editor` blocks:

```
config editor
push "hackerman"
set colorScheme
push "8x16"
set font
configEnd
```

These blocks:
- Use the stack-config language with a dedicated schema
- Are compiled automatically when blocks change
- Update `state.editorSettings` with compiled values
- Persist separately from project files via callbacks
- Are excluded from project exports and imports

## Current Scope

- **Color Schemes**: List of available schemes with selection
- **Font**: Choice between '6x10' and '8x16' fonts
- Additional settings may be added in the future

## Events & Callbacks

### Callbacks Used

- `loadEditorSettings()` - Loads persisted editor settings object
- `saveEditorSettings(settings)` - Persists editor settings object
- `loadEditorConfigSource()` - Loads persisted editor config block source
- `saveEditorConfigSource(source)` - Persists editor config block source (including markers/comments)
- `getListOfColorSchemes()` - Retrieves list of available color schemes
- `getColorScheme(name)` - Retrieves specific color scheme definition
- `compileConfig(source, schema)` - Compiles editor config blocks

### State Touched

- `state.editorSettings.colorScheme` - Name of currently active color scheme
- `state.editorSettings.font` - Currently selected font
- `state.colorSchemes` - Array of available color scheme names
- `state.colorScheme` - Currently active color scheme definition
- `state.codeErrors.editorConfigErrors` - Array of editor config compilation errors

## Integration Points

- **UI Rendering**: Color scheme and font selection affects editor visual appearance
- **Persistent Storage**: Settings and config source are saved/loaded through callback system
- **Runtime Updates**: Settings changes trigger visual updates in the editor
- **Config Compiler**: Uses config-compiler feature to compile `config editor` blocks

## Notes & Limitations

- Current implementation focuses on color schemes and fonts
- Settings persistence depends on external callbacks being provided
- Runtime updates are propagated through state manager subscriptions
- Editor config blocks are session-specific and excluded from project files
- Only the first editor config block is currently persisted (future: support multiple blocks)
- Config block creation from persisted source not yet fully implemented (see TODO #197)
