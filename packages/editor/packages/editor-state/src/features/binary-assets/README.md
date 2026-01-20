# Binary Assets Feature

## Purpose

Manages binary asset loading into runtime memory from config-defined URLs. This feature handles the collection of binary assets (images, audio files, etc.) that are used by the 8f4e program.

⚠️ **Status**: Work in progress - API and behavior may change.

## Key Behaviors

- **Memory Loading**: Handles loading binary assets into runtime memory via the `loadBinaryAssetIntoMemory` callback
- **Asset Collection**: Maintains the list of loaded assets in `state.binaryAssets`

## Events & Callbacks

### Events Listened To

- `loadBinaryFilesIntoMemory` - Loads all collected binary assets into runtime memory
- `clearBinaryAssetCache` - Clears the editor-side cache for binary asset URLs

### Callbacks Used

- `state.callbacks.fetchBinaryAssets(urls)` - Fetches binary assets and returns metadata
- `state.callbacks.loadBinaryAssetIntoMemory(asset)` - Loads a single asset into memory
- `state.callbacks.clearBinaryAssetCache()` - Clears the editor-side cache for binary assets

## State Touched

- `state.binaryAssets` - Array of imported binary asset objects
- `state.callbacks.loadBinaryAssetIntoMemory` - Callback function for loading assets into memory
- `state.callbacks.clearBinaryAssetCache` - Callback function for clearing the cache

## Integration Points

- **Compiler**: Binary assets are fed into the compiler/runtime for memory loading
- **Project Export**: Asset collection is serialized as part of project data
- **Runtime**: Assets are loaded into runtime memory when memory is recreated

## Notes & Limitations

- Currently in WIP status - implementation details may change
- Asset loading is triggered automatically when runtime memory is recreated
