# Project Import Feature

## Purpose

Handles loading projects into the editor from various sources: persistent storage, file uploads, direct project URLs, and default templates. Manages the initial project state and coordinates with import callbacks.

## Key Behaviors

- **Initial Load**: Loads project from storage or falls back to default on editor startup
- **File Import**: Handles importing project files through file picker
- **URL Import**: Loads projects by project URL
- **Default Project**: Provides fallback when no saved project exists
- **State Initialization**: Sets up `initialProjectState` for the editor

## Import Sources

### Storage Load
- Loads most recent saved project from persistent storage
- Triggered automatically on editor initialization

### File Import
- User-triggered file picker for `.8f4e` project files
- Parses and validates project JSON

### Slug Import
- Loads projects by shareable URL identifier
- Uses `importProjectBySlug` callback for remote fetching

### Default Template
- Fallback when no saved project or specified import
- Provides starting point for new projects

## Events & Callbacks

### Events Listened To

- `loadProject` - Loads a project object into editor state
- File import events (implementation-specific)
- Slug import events (implementation-specific)

### Callbacks Used

- `state.callbacks.loadProjectFromStorage()` - Retrieves saved project
- `state.callbacks.importProjectFile()` - Opens file picker and parses project
- `state.callbacks.importProjectBySlug(slug)` - Fetches project by identifier

### State Touched

- `state.initialProjectState` - Initial project loaded on startup
- `state.graphicHelper` - Updated with loaded code blocks and viewport
- `state.binaryAssets` - Updated with loaded binary assets

## Integration Points

- **Project Export**: Imported projects match exported project schema
- **Config Compiler**: Loaded config blocks trigger config compilation
- **Program Compiler**: Loaded code blocks trigger program compilation if enabled
- **Edit History**: Project loads reset history stacks

## Project Loading Flow

1. Attempt to load from storage (if available)
2. If storage load fails, use default project
3. Convert grid coordinates to pixel coordinates for viewport
4. Initialize code blocks with proper positioning
5. Trigger initial compilation (if auto-compile enabled)

## Coordinate Conversion

- **Imported Projects**: Grid coordinates from serialized format
- **Editor State**: Converted to pixel coordinates
- Conversion: `pixelCoord = gridCoord * gridSize`

## References

- Project schema: See `project-export` feature for structure
- Counterpart: `project-export` feature for saving

## Notes & Limitations

- Import callbacks are optional (graceful degradation to defaults)
- Project validation is minimal (assumes well-formed JSON)
- Binary asset files must be available at their referenced paths
- Import does not validate WASM bytecode compatibility
