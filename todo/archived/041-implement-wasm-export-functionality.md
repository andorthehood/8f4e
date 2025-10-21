---
title: 'TODO: Implement WebAssembly Export Functionality'
priority: 🟡
effort: 4-6 hours
created: 2025-08-27
status: Completed
completed: 2025-08-27
---

# TODO: Implement WebAssembly Export Functionality

**Priority**: ��

## Problem Description

Currently, users can compile their projects to WebAssembly bytecode, but there's no way to export this compiled bytecode as a downloadable file. This limits the ability to:
- Share compiled modules with other developers
- Use the compiled WASM in other projects
- Archive or backup compiled versions
- Distribute standalone WASM modules

The current architecture has separate file export callbacks (`saveProjectToFile`) which creates code duplication and makes it harder to maintain consistent file export behavior.

## Proposed Solution

Implement a generic file export system that allows users to export compiled WebAssembly bytecode through a context menu item. This will:

1. **Add a generic `exportFile` callback** to replace the specific `saveProjectToFile` callback
2. **Add "Export WebAssembly" menu item** to the main context menu
3. **Create a new export effect** that handles WASM export logic
4. **Integrate with existing compilation system** to access the compiled bytecode

The solution follows the existing architectural patterns and provides a foundation for future file export types.

## Implementation Plan

### Step 1: Update Options Interface
- Modify `packages/editor/src/state/types.ts` to replace `saveProjectToFile` with generic `exportFile` callback
- Update the callback signature to handle different data types: `exportFile(data: Uint8Array | string, filename: string, mimeType?: string)`
- **Expected outcome**: Cleaner, more extensible interface for file operations
- **Dependencies**: None

### Step 2: Refactor Storage Callbacks
- Update `src/storage-callbacks.ts` to implement generic `exportFile` function
- Modify existing `saveProjectToFile` to use the new generic callback
- Handle both binary (Uint8Array) and text (string) data types appropriately
- **Expected outcome**: Single source of truth for file export logic
- **Dependencies**: Step 1 completion

### Step 3: Update Save Effect
- Modify `packages/editor/src/state/effects/save.ts` to use the new generic `exportFile` callback
- Ensure project saving still works with the new interface
- **Expected outcome**: Project saving functionality maintained with new architecture
- **Dependencies**: Step 2 completion

### Step 4: Add Export WASM Menu Item
- Add "Export WebAssembly" item to `packages/editor/src/state/effects/menu/menus.ts` main menu
- Position it logically near other export/save options
- **Expected outcome**: New menu item appears in context menu
- **Dependencies**: None

### Step 5: Create Export WASM Effect
- Create new file `packages/editor/src/state/effects/exportWasm.ts`
- Implement logic to check for compiled WASM code availability
- Handle export validation and error cases
- **Expected outcome**: New effect handles WASM export events
- **Dependencies**: Step 4 completion

### Step 6: Register Export WASM Effect
- Add the new effect to state initialization in `packages/editor/src/state/index.ts`
- Ensure proper event handling registration
- **Expected outcome**: WASM export functionality becomes available
- **Dependencies**: Step 5 completion

### Step 7: Update Main Editor
- Modify `src/editor.ts` to use the new generic `exportFile` callback
- Remove the old `saveProjectToFile` callback registration
- **Expected outcome**: Editor uses unified file export system
- **Dependencies**: Step 2 completion

### Step 8: Testing and Validation
- Test WASM export functionality with compiled projects
- Verify project saving still works correctly
- Test error handling for cases without compiled code
- **Expected outcome**: All functionality works as expected
- **Dependencies**: All previous steps completion

## Success Criteria

- [ ] Users can export compiled WebAssembly bytecode as .wasm files
- [ ] "Export WebAssembly" menu item appears in context menu
- [ ] Menu item is disabled when no compiled code is available
- [ ] Project saving functionality continues to work unchanged
- [ ] Generic export system handles both text and binary data types
- [ ] Error handling provides appropriate user feedback
- [ ] No breaking changes to existing functionality

## Affected Components

- `packages/editor/src/state/types.ts` - Add generic exportFile callback interface
- `packages/editor/src/state/effects/menu/menus.ts` - Add new menu item
- `packages/editor/src/state/effects/exportWasm.ts` - New file for WASM export logic
- `packages/editor/src/state/effects/save.ts` - Update to use generic callback
- `packages/editor/src/state/index.ts` - Register new export effect
- `src/storage-callbacks.ts` - Implement generic exportFile function
- `src/editor.ts` - Update callback registration

## Risks & Considerations

- **Risk 1**: Breaking existing project save functionality
  - **Mitigation**: Thorough testing and gradual migration
- **Risk 2**: Menu item appearing when no WASM code is available
  - **Mitigation**: Add validation logic to check compilation state
- **Risk 3**: File type handling complexity
  - **Mitigation**: Clear type checking and appropriate MIME type handling
- **Dependencies**: None - this is a self-contained feature
- **Breaking Changes**: Minimal - only affects internal callback structure

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: 
  - Compiler functionality (provides the WASM bytecode)
  - Context menu system (provides the UI)
  - File export system (provides the foundation)

## References

- [WebAssembly MIME type specification](https://webassembly.github.io/spec/web-api/#streaming-modules)
- [Browser download API documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [Existing file export patterns in the codebase](src/storage-callbacks.ts)

## Notes

- This implementation follows the existing architectural patterns in the codebase
- The generic exportFile approach provides a foundation for future export types
- The solution maintains backward compatibility while improving the architecture
- Consider adding export options (filename customization, export location) in future iterations

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 