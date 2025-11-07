---
title: 'TODO: Enable Runtime-Only Project Execution'
priority: Medium
effort: 3-4 hours
created: 2025-08-27
status: Completed
completed: null
---

# TODO: Enable Runtime-Only Project Execution

**Priority**:

Currently, when users export and share projects, the recipients need the full compiler infrastructure to run them. This creates several barriers:

- **Compilation dependency** - Users must have the compiler package installed
- **Setup complexity** - Additional build tools and dependencies required
- **Slower execution** - Projects must be compiled from source every time
- **Distribution friction** - Can't easily share "ready-to-run" projects
- **Runtime limitations** - Projects can only run in environments with full compiler access

This prevents the creation of lightweight, distributable project packages that could run in minimal runtime environments.

## Proposed Solution

Include compiled WebAssembly bytecode in project exports so that projects can be executed with only a runtime, without requiring the compiler. This will:

1. **Enable standalone execution** - Projects run immediately without compilation
2. **Reduce distribution size** - No need to include source code or compiler
3. **Improve performance** - Instant loading and execution
4. **Simplify deployment** - Only runtime dependencies needed
5. **Maintain flexibility** - Source code still available for modification

The solution creates a "compiled project" format that's optimized for distribution and execution.

## Implementation Plan

### Step 1: Update Project Interface
- Modify `packages/editor/src/state/types.ts` to add optional `compiledWasm` field to Project interface
- Store WASM bytecode as base64-encoded string for JSON compatibility
- Include essential runtime metadata (memory size, entry points, dependencies)
- **Expected outcome**: Project type supports compiled bytecode storage as base64
- **Dependencies**: None

### Step 2: Add Compilation-Free Runtime Mode
- Modify runtime loading to detect and use pre-compiled bytecode
- Decode base64 WASM data back to Uint8Array for execution
- Skip compilation step when valid bytecode is present
- **Expected outcome**: Projects with bytecode run without compiler
- **Dependencies**: Step 1 completion

### Step 3: Update Project Export Logic
- Modify `packages/editor/src/state/effects/save.ts` to include compiled bytecode
- Convert WASM Uint8Array to base64 string before JSON serialization
- Add export option: "Export as Runtime-Ready Project"
- **Expected outcome**: Users can export projects that don't need compilation
- **Dependencies**: Step 2 completion

### Step 4: Add Separate Menu Item for Runtime Export
- Add new menu item "Export Runtime-Ready Project" to main context menu
- Position it separately from the existing "Export Project" option
- Make it clear this includes compiled WASM bytecode as base64
- **Expected outcome**: Clear distinction between source and runtime export options
- **Dependencies**: Step 3 completion

### Step 5: Implement Runtime-Only Project Loading
- Create lightweight project loader that doesn't require compiler
- Decode base64 WASM data and validate bytecode integrity
- **Expected outcome**: Runtime-only environments can load compiled projects
- **Dependencies**: Step 4 completion

### Step 6: Add Export Format Options
- Provide choice between "Source Project" (with code) and "Runtime Project" (compiled only)
- Update UI to make this distinction clear
- **Expected outcome**: Users understand the trade-offs of each format
- **Dependencies**: Step 5 completion

### Step 7: Testing and Validation
- Test runtime-only project execution
- Verify projects work without compiler dependencies
- Test backward compatibility
- **Expected outcome**: Both export formats work correctly
- **Dependencies**: All previous steps completion

## Success Criteria

- [ ] Users can export projects as "runtime-ready" packages
- [ ] Runtime-only projects execute without compiler infrastructure
- [ ] Source projects maintain full editability and compilation
- [ ] Clear distinction between export formats in UI
- [ ] Runtime projects load and execute significantly faster
- [ ] Backward compatibility maintained for existing projects
- [ ] Separate menu items for "Export Project" and "Export Runtime-Ready Project"
- [ ] WASM bytecode is properly encoded as base64 in project JSON
- [ ] Base64 WASM data is correctly decoded during project loading

## Affected Components

- `packages/editor/src/state/types.ts` - Add compiledWasm field to Project interface
- `packages/editor/src/state/effects/menu/menus.ts` - Add new runtime export menu item
- `packages/editor/src/state/effects/save.ts` - Support runtime-only export format with base64 encoding
- `packages/editor/src/state/effects/loader.ts` - Handle runtime-only project loading with base64 decoding
- Runtime packages - Support execution without compilation
- UI components for export format selection

## Risks & Considerations

- **Risk 1**: Runtime projects become "black boxes" - users can't modify them
  - **Mitigation**: Clear labeling and option to export with source code
- **Risk 2**: Bytecode compatibility issues across different environments
  - **Mitigation**: Include runtime version requirements and validation
- **Risk 3**: Increased project file sizes due to base64 encoding overhead
  - **Mitigation**: Make runtime-only export optional, add size information
- **Risk 4**: Menu confusion between similar export options
  - **Mitigation**: Clear labeling and positioning of menu items
- **Risk 5**: Base64 encoding/decoding errors
  - **Mitigation**: Proper error handling and validation during conversion
- **Dependencies**: 
  - WebAssembly export functionality (TODO #041) should be completed first
- **Breaking Changes**: None - fully backward compatible

## Related Items

- **Blocks**: None
- **Depends on**: 
  - [TODO #041: Implement WebAssembly Export Functionality](./041-implement-wasm-export-functionality.md)
- **Related**: 
  - Runtime system design
  - Project distribution workflow
  - Compiler architecture

## References

- [WebAssembly runtime execution](https://webassembly.github.io/spec/js-api/)
- [Base64 encoding/decoding in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/btoa)
- [Project distribution patterns](docs/instructions.md)

## Notes

- This feature enables a new distribution model: "compile once, run anywhere"
- Runtime-only projects are ideal for end users who want to run projects without development setup
- Source projects remain the default for developers and creators
- Consider adding runtime version compatibility checking
- This aligns with the goal of making the platform more accessible to non-technical users
- The separate menu item makes it clear that runtime export is a distinct feature from source export
- Base64 encoding ensures WASM bytecode can be safely stored in JSON format
- Base64 encoding adds approximately 33% size overhead but ensures JSON compatibility

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
