# TODO: Create Main Thread Logic Runtime

**Priority**: 🟡
**Estimated Effort**: 4-6 hours
**Created**: 2024-12-19
**Status**: ✅ **COMPLETED** - 2024-12-19
**Completed**: 2024-12-19 

## Problem Description

Currently, the application uses a web worker-based logic runtime (`runtime-web-worker-logic`) to execute WebAssembly modules in a separate thread. While this approach provides non-blocking execution, there are scenarios where running logic directly on the main thread would be beneficial:

- **Debugging**: Easier to debug and inspect runtime state when running on main thread
- **Performance**: Eliminates worker message passing overhead for simple modules
- **Integration**: Better integration with browser dev tools and debugging capabilities
- **Flexibility**: Provides an alternative runtime option for users who prefer main-thread execution

## Proposed Solution

Create a new runtime package called `main-thread-logic-runtime` that mirrors the functionality of `runtime-web-worker-logic` but executes directly on the browser's main thread. This runtime will:

- Use the same WebAssembly module interface (`createModule`)
- Implement the same timing and cycle management logic
- Provide direct access to runtime state and performance metrics
- Integrate with the existing runtime factory pattern

## Implementation Plan

### Step 1: Create Package Structure
- Create new package directory `packages/main-thread-logic-runtime/`
- Copy and adapt the structure from `runtime-web-worker-logic`
- Update package.json with new name and description
- Update project.json with appropriate tags

### Step 2: Implement Main Thread Runtime
- Adapt `createModule.ts` for main thread execution
- Modify the main runtime logic to run on main thread instead of worker
- Replace `setInterval` with `requestAnimationFrame` or maintain `setInterval` for audio timing
- Implement direct event dispatching instead of worker message passing

### Step 3: Create Runtime Factory
- Create `src/main-thread-logic-runtime-factory.ts`
- Adapt the factory pattern from `runtime-web-worker-logic-factory.ts`
- Remove worker-specific code and implement direct function calls
- Maintain the same event interface for compatibility

### Step 4: Integration and Testing
- Add the new runtime to the editor's runtime options
- Update vite.config.mjs with the new package alias
- Test the runtime with existing modules
- Verify performance and debugging capabilities

## Success Criteria

- [ ] New `main-thread-logic-runtime` package compiles successfully
- [ ] Runtime executes WebAssembly modules on main thread
- [ ] Factory function integrates with existing editor state management
- [ ] Runtime can be selected as an alternative to web worker runtime
- [ ] Performance metrics and debugging work as expected
- [ ] No breaking changes to existing functionality

## Affected Components

- `packages/main-thread-logic-runtime/` - New package to be created
- `src/main-thread-logic-runtime-factory.ts` - New factory file to be created
- `src/editor.ts` - May need updates to support runtime selection
- `vite.config.mjs` - Add new package alias
- `packages/editor/package.json` - Add dependency if needed

## Risks & Considerations

- **Performance Impact**: Running on main thread could block UI if modules are computationally intensive
- **Timing Precision**: Main thread execution might have different timing characteristics than web workers
- **Browser Compatibility**: Ensure the runtime works across different browsers
- **Dependencies**: The new runtime should not interfere with existing web worker runtime
- **Breaking Changes**: Maintain backward compatibility with existing runtime selection logic

## Related Items

- **Depends on**: Existing `runtime-web-worker-logic` structure and patterns
- **Related**: Runtime selection and configuration in editor
- **Blocks**: Potential future debugging and development tooling improvements

## References

- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

## Notes

- The main thread runtime should maintain the same interface as the web worker runtime for easy switching
- Consider adding a configuration option to automatically fall back to main thread if web workers are not available
- Performance monitoring should include main thread blocking detection
- This runtime could serve as a foundation for future debugging and development tools

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 