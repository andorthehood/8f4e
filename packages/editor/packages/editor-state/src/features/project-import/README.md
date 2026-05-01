# Project Import Feature

## Purpose

Handles loading projects into the editor from persistent storage, `.8f4e` file uploads, direct project URLs, and default templates. Manages the initial project state and coordinates with import callbacks.

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
- Parses `.8f4e` text into the project structure

### URL Import
- Loads projects by shareable URL identifier
- Uses the `getProject` callback for remote fetching

### Default Template
- Fallback when no saved project or specified import
- Provides starting point for new projects

## Events & Callbacks

### Events Listened To

- `loadProject` - Loads a project object into editor state
- `importProject` - Imports a `.8f4e` project from disk
- `loadProjectByUrl` - Loads and parses a `.8f4e` project from a URL

### Callbacks Used

- `state.callbacks.loadSession()` - Retrieves the locally saved project object
- `state.callbacks.importProject()` - Opens file picker and parses `.8f4e` text
- `state.callbacks.getProject(url)` - Fetches `.8f4e` text by URL

### State Touched

- `state.initialProjectState` - Initial project loaded on startup
- `state.graphicHelper` - Populated from loaded code blocks

## Integration Points

- **Project Export**: Imported projects match exported project schema
- **Program Compiler**: Loaded code blocks trigger program compilation if enabled
- **Edit History**: Project loads reset history stacks

## Project Loading Flow

1. Attempt to load from storage (if available)
2. If storage load fails, use default project
3. Initialize code blocks from the project structure
4. Trigger initial compilation if enabled

## References

- Project schema: See `project-export` feature for structure
- Counterpart: `project-export` feature for saving

## Notes & Limitations

- Import callbacks are optional (graceful degradation to defaults)
- Project validation is minimal beyond `.8f4e` parser checks
- Binary asset files must be available at their referenced paths
