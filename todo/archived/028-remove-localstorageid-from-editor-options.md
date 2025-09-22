# TODO: Remove localStorageId from Editor Options

**Priority**: 🟡
**Estimated Effort**: 0.5-1 day
**Created**: 2025-08-26
**Status**: Completed
**Completed**: 2025-08-27

## Problem Description

Currently, the `initEditor` function requires a `localStorageId` in the options:

```typescript
const editor = await initEditor(canvas, project, {
  localStorageId: 'editor', // Editor shouldn't know about this
  // ... other options
});
```

This creates a design issue:
- **Storage Coupling**: The editor is coupled to localStorage implementation details
- **Implementation Leakage**: Storage mechanism details leak into the editor's public API
- **Reduced Flexibility**: Consumers can't easily switch to different storage mechanisms
- **Violation of Separation of Concerns**: Editor shouldn't know about storage keys or identifiers

## Proposed Solution

Remove `localStorageId` from the options since the editor shouldn't know about storage implementation details. The storage callbacks should handle their own storage keys/identifiers internally.

**Benefits:**
- Editor is completely decoupled from storage implementation
- Storage callbacks are responsible for their own storage key management
- Easier to implement different storage mechanisms (IndexedDB, remote storage, etc.)
- Cleaner separation of concerns

## Implementation Plan

### Step 1: Update Options Interface
- Modify `packages/editor/src/state/types.ts`
- Remove `localStorageId` property entirely from `Options` interface

### Step 2: Update Storage Callback Signatures
- Modify storage callback signatures to not require storageId parameter:
  - `loadProjectFromStorage(): Promise<Project | null>`
  - `saveProjectToStorage(project: Project): Promise<void>`
  - `loadEditorSettingsFromStorage(): Promise<EditorSettings | null>`
  - `saveEditorSettingsToStorage(settings: EditorSettings): Promise<void>`

### Step 3: Update Editor Usage of Storage Callbacks
- Modify `packages/editor/src/state/effects/loader.ts`
- Update calls to storage callbacks to not pass storageId
- Remove any logic that depends on localStorageId

### Step 4: Update Consumer Code
- Modify `src/editor.ts`
- Remove `localStorageId` from initEditor options
- Update storage callbacks to handle storage keys internally

### Step 5: Update Storage Callback Implementations
- Modify `src/storage-callbacks.ts`
- Update all storage callbacks to manage their own storage keys
- Use constants or configuration for storage key management

## Success Criteria

- [x] `localStorageId` is removed from `Options` interface
- [x] Storage callback signatures no longer require storageId parameters
- [x] Editor calls storage callbacks without storage-related parameters
- [x] Storage callbacks handle their own storage key management
- [x] All existing functionality preserved
- [x] Tests pass with new API
- [x] Consumer code is updated to handle storage keys internally

## Affected Components

- `packages/editor/src/state/types.ts` - Remove localStorageId from Options interface
- `packages/editor/src/state/effects/loader.ts` - Update storage callback calls
- `src/editor.ts` - Remove localStorageId from options
- `src/storage-callbacks.ts` - Update callback implementations to handle storage keys internally

## Risks & Considerations

- **Breaking Change**: This is a breaking change to the public API
- **Migration**: Existing consumers will need to update their code
- **Storage Key Management**: Consumers must ensure their storage callbacks handle storage keys properly
- **Testing**: Need to ensure storage functionality still works correctly

## Related Items

- **Related**: TODO-027 (Remove project parameter from initEditor) - Similar refactoring to decouple editor from implementation details
- **Related**: TODO-021 (Refactor modules/projects to async callbacks) - Part of the broader callback pattern refactoring

## References

- Current `Options` interface in `packages/editor/src/state/types.ts`
- Storage callback usage in `packages/editor/src/state/effects/loader.ts`
- Consumer usage in `src/editor.ts`
- Storage callbacks in `src/storage-callbacks.ts`

## Notes

- This refactoring improves the separation of concerns between the editor and storage
- Storage callbacks should be responsible for their own storage key management (e.g., using constants or configuration)
- Consider adding a feature flag to make this change opt-in initially if needed
- The editor should be completely agnostic to how storage is implemented

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
