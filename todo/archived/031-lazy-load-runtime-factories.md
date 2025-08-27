# TODO: Implement Lazy-Loaded Runtime Factories

**Priority**: ��
**Estimated Effort**: 2-3 hours
**Created**: 2025-08-27
**Status**: Completed ✅
**Completed**: 2025-08-27 

## Problem Description

Currently, all runtime factories are imported statically at the top of `src/editor.ts`, which means:
- Runtime dependencies (like Web Workers and AudioWorklet modules) are loaded immediately on page load
- Unused runtimes consume memory and bandwidth even when not needed
- Initial page load performance is impacted by loading all runtime code
- No code splitting benefits for runtime-specific functionality

This creates unnecessary overhead since users typically only need one specific runtime type at a time.

## Proposed Solution

Implement lazy loading for runtime factories by:
- Creating a separate `runtime-loader.ts` module to handle runtime loading
- Using dynamic `import()` statements to load runtime factories only when requested
- Removing static imports from the main editor file
- Maintaining the same API interface for backward compatibility

## Implementation Plan

### Step 1: Create Runtime Loader Module
- Create `src/runtime-loader.ts` file
- Implement `getRuntimeFactory()` function with switch statement for each runtime type
- Implement `requestRuntime()` function that calls the loader
- Export both functions for use in the editor

### Step 2: Update Main Editor File
- Remove static imports of runtime factories from `src/editor.ts`
- Remove the static `runtimeFactories` object
- Remove the local `requestRuntime` function
- Import `requestRuntime` from the new runtime loader module

### Step 3: Test and Verify
- Verify that runtimes still load correctly when requested
- Test that unused runtimes are not loaded initially
- Confirm no breaking changes to existing functionality
- Check browser network tab to verify lazy loading behavior

## Success Criteria

- [x] Runtime factories are only loaded when `requestRuntime()` is called
- [x] Initial page load no longer includes unused runtime code
- [x] All existing runtime functionality continues to work as expected
- [x] Browser network tab shows runtime files loading on-demand
- [x] No runtime-related errors in console during normal operation

## Affected Components

- `src/editor.ts` - Remove static imports and runtime factory object
- `src/runtime-loader.ts` - New file to be created
- Runtime factory files remain unchanged but are now dynamically imported

## Risks & Considerations

- **Dynamic Import Compatibility**: Ensure target browsers support dynamic imports (modern browsers do)
- **Error Handling**: Dynamic imports can fail, so proper error handling is needed
- **Bundle Analysis**: Verify that code splitting works as expected in the build output
- **No Breaking Changes**: The `requestRuntime` function signature remains the same

## Dependencies

- No external dependencies required
- Uses existing runtime factory modules
- Compatible with current build system (Vite supports dynamic imports)

## Related Items

- **Related**: Runtime factory modules (`audio-worklet-runtime-factory.ts`, `web-worker-logic-runtime-factory.ts`, `web-worker-midi-runtime-factory.ts`)
- **Related**: Editor initialization and runtime management

## References

- [Dynamic Import MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_imports)
- [Vite Dynamic Import Support](https://vitejs.dev/guide/features.html#dynamic-import)

## Notes

- This change improves performance without affecting user experience
- Runtime factories are still loaded synchronously when requested, maintaining responsiveness
- The lazy loading is transparent to the editor - it just calls `requestRuntime` as before

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.

## Completion Summary

**Implementation completed on 2025-01-02**

### Changes Made:
1. **Created** `src/runtime-loader.ts` with dynamic import-based lazy loading
2. **Updated** `src/editor.ts` to remove static imports and use the new runtime loader
3. **Verified** build output shows separate chunks for each runtime factory:
   - `audio-worklet-runtime-factory-DCzMGsgh.js` (4.48 kB)
   - `web-worker-logic-runtime-factory-Vce6CEjV.js` (0.72 kB)
   - `web-worker-midi-runtime-factory-aqGgCjYg.js` (1.22 kB)

### Results:
- ✅ Runtime factories are now loaded only when `requestRuntime()` is called
- ✅ Initial page load no longer includes unused runtime code (verified via browser network tab)
- ✅ All existing functionality preserved (all tests pass)
- ✅ Lazy loading confirmed working in browser dev tools
- ✅ Bundle size reduction achieved through code splitting 