# Binary Assets Feature

## Purpose

Manages binary asset imports and loading into runtime memory. This feature handles the collection of binary assets (images, audio files, etc.) that are used by the 8f4e program.

⚠️ **Status**: Work in progress - API and behavior may change.

## Key Behaviors

- **Asset Import**: Provides event handler for importing binary assets through the `importBinaryAsset` callback
- **Memory Loading**: Handles loading binary assets into runtime memory via the `loadBinaryFileIntoMemory` callback
- **Asset Collection**: Maintains the list of imported assets in `state.binaryAssets`

## Events & Callbacks

### Events Listened To

- `importBinaryAsset` - Triggers the import flow for a new binary asset
- `loadBinaryFilesIntoMemory` - Loads all collected binary assets into runtime memory

### Callbacks Used

- `state.callbacks.importBinaryAsset()` - Returns a promise that resolves to a binary asset object
- `state.callbacks.loadBinaryFileIntoMemory(asset)` - Loads a single asset into memory

## State Touched

- `state.binaryAssets` - Array of imported binary asset objects
- `state.callbacks.importBinaryAsset` - Callback function for importing assets
- `state.callbacks.loadBinaryFileIntoMemory` - Callback function for loading assets into memory

## Integration Points

- **Compiler**: Binary assets are fed into the compiler/runtime for memory loading
- **Project Export**: Asset collection is serialized as part of project data
- **Runtime**: Assets are loaded into runtime memory when memory is recreated

## Notes & Limitations

- Currently in WIP status - implementation details may change
- Requires external callbacks to be provided for file system operations
- Asset loading is triggered automatically when runtime memory is recreated
