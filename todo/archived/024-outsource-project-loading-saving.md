---
title: 'TODO: Outsource Project Loading and Saving'
priority: �
effort: 1-2 days
created: 2025-08-26
status: Completed
completed: 2025-09-04
---

# TODO: Outsource Project Loading and Saving

## Problem Description

The editor currently has tight coupling with browser APIs for project loading and saving functionality. This creates several issues:

- **Browser API Dependencies**: Direct usage of `localStorage`, `FileReader`, `Blob`, `URL.createObjectURL`, and `document.createElement`
- **Limited Flexibility**: Consumers cannot provide their own storage or file handling strategies
- **Testing Complexity**: The editor is harder to test in isolation without mocking browser APIs
- **Environment Restrictions**: The editor cannot run in non-browser environments (Node.js, Web Workers, etc.)
- **Bundle Size**: Browser-specific code is included even when not needed

**Current Implementation Issues:**
- `packages/editor/src/state/effects/loader.ts` - Uses `localStorage.getItem/setItem` and `FileReader`
- `packages/editor/src/state/effects/save.ts` - Uses `Blob`, `URL.createObjectURL`, and DOM manipulation
- `packages/editor/src/state/effects/binaryAssets.ts` - Uses `FileReader` and `FileSystemFileHandle`

## Proposed Solution

Add async callback functions to the editor's Options interface that allow consumers to provide their own storage and file handling strategies. This will:

- Decouple the editor from specific browser APIs
- Allow consumers to use different storage mechanisms (IndexedDB, remote storage, etc.)
- Make the editor more testable and flexible
- Enable the editor to run in non-browser environments
- Reduce browser-specific code in the editor bundle

The callbacks should handle:
- Loading projects from storage
- Saving projects to storage
- Loading projects from files
- Saving projects to files
- Importing binary assets

## Implementation Plan

### Step 1: Update Options Interface
- Add storage and file handling callbacks to the Options interface:
  ```typescript
  interface Options {
    // ... existing options ...
    
    // Storage callbacks
    loadProjectFromStorage: (storageId: string) => Promise<Project | null>;
    saveProjectToStorage: (storageId: string, project: Project) => Promise<void>;
    loadEditorSettingsFromStorage: (storageId: string) => Promise<EditorSettings | null>;
    saveEditorSettingsToStorage: (storageId: string, settings: EditorSettings) => Promise<void>;
    
    // File handling callbacks
    loadProjectFromFile: (file: File) => Promise<Project>;
    saveProjectToFile: (project: Project, filename: string) => Promise<void>;
    importBinaryAsset: (file: File) => Promise<{ data: string, fileName: string }>;
  }
  ```
- Remove `localStorageId` from Options (no longer needed)

### Step 2: Refactor Loader Effect
- Modify `packages/editor/src/state/effects/loader.ts` to use the provided callbacks
- Remove direct `localStorage` and `FileReader` usage
- Update project loading logic to call external callbacks
- Handle async loading with proper error handling

### Step 3: Refactor Save Effect
- Modify `packages/editor/src/state/effects/save.ts` to use the provided save callback
- Remove direct `Blob`, `URL.createObjectURL`, and DOM manipulation
- Update save logic to call external callback

### Step 4: Refactor Binary Assets Effect
- Modify `packages/editor/src/state/effects/binaryAssets.ts` to use the provided import callback
- Remove direct `FileReader` and `FileSystemFileHandle` usage
- Update binary asset import logic to call external callback

### Step 5: Update Feature Flags
- Remove `localStorage` feature flag (no longer needed)
- Update tests to reflect the new callback-based approach

### Step 6: Update Consumer Examples
- Modify the main application to provide the storage and file handling callbacks
- Ensure the editor still works with the existing functionality
- Update any tests that depend on the current implementation

## Success Criteria

- [ ] Editor can be initialized without browser API dependencies
- [ ] All storage and file handling callbacks are properly called when needed
- [ ] Editor works with external storage and file handling implementations
- [ ] No browser-specific code remains in the editor package
- [ ] Editor can run in non-browser environments (with appropriate callbacks)
- [ ] Bundle size is reduced by removing browser-specific code
- [ ] Tests pass with external callback implementations

## Affected Components

- `packages/editor/src/state/types.ts` - Add new callback interfaces to Options
- `packages/editor/src/state/effects/loader.ts` - Refactor to use external callbacks
- `packages/editor/src/state/effects/save.ts` - Refactor to use external callbacks
- `packages/editor/src/state/effects/binaryAssets.ts` - Refactor to use external callbacks
- `packages/editor/src/config/featureFlags.ts` - Remove localStorage feature flag
- `packages/editor/src/index.ts` - Update main entry point
- `src/editor.ts` - Update main application to provide callbacks
- `packages/editor/src/state/index.ts` - Update state initialization

## Risks & Considerations

- **Risk 1**: Breaking existing functionality if the callback interfaces are not properly designed
  - **Mitigation**: Maintain backward compatibility and provide sensible defaults
- **Risk 2**: Performance impact from external storage/file handling calls
  - **Mitigation**: Ensure all callbacks are async and don't block the main thread
- **Risk 3**: Complexity of managing multiple async operations
  - **Mitigation**: Design clear error handling and loading states
- **Dependencies**: The callbacks must provide compatible data structures
- **Breaking Changes**: Moderate - requires updating all consumers to provide callbacks

## Related Items

- **Depends on**: None
- **Related**: 
  - `todo/023-outsource-compiler-from-editor.md` - Similar pattern for compiler outsourcing
  - `todo/015-lazyload-runtimes.md` - Similar pattern for runtime loading
  - `todo/019-pass-runtime-instances-through-options.md` - Similar pattern for runtime configuration

## References

- [Current loader implementation](packages/editor/src/state/effects/loader.ts)
- [Current save implementation](packages/editor/src/state/effects/save.ts)
- [Current binary assets implementation](packages/editor/src/state/effects/binaryAssets.ts)
- [Editor Options interface](packages/editor/src/state/types.ts)

## Notes

This refactoring follows the same pattern used for compiler and runtime outsourcing, where the editor accepts callbacks for external functionality rather than directly importing and managing browser APIs. This approach makes the editor more modular and easier to integrate into different environments.

**Key Design Decisions:**
- All callbacks are async to handle potentially slow storage/file operations
- Callbacks handle both success and error cases (no fallback to internal implementations)
- Storage callbacks return null when no data exists (allowing for "no saved data" scenarios)
- File handling callbacks receive standard File objects for maximum compatibility
- Binary asset import returns base64 data and filename for consistency

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 