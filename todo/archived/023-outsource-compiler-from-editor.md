# TODO: Outsource Compiler from Editor

**Priority**: 🟡
**Estimated Effort**: 2-3 days
**Created**: 2025-09-11
**Status**: Completed
**Completed**: 2025-09-11

## Problem Description

The editor currently has tight coupling with the compiler through the `@8f4e/compiler-worker` package and direct imports from `@8f4e/compiler`. This creates several issues:

- **Tight Coupling**: The editor directly imports and manages compiler types, worker instances, and compilation logic
- **Limited Flexibility**: Consumers of the editor cannot provide their own compilation strategy or use different compilers
- **Testing Complexity**: The editor is harder to test in isolation without mocking the entire compiler system
- **Bundle Size**: The editor bundle includes compiler-specific code even when not needed

The current implementation in `packages/editor/src/state/effects/compiler.ts` directly creates a Web Worker, manages compilation state, and handles compiler-specific data structures.

## Proposed Solution

**Clarification**: The goal is NOT to replace the `@8f4e/compiler-worker` package entirely, but to move the responsibility of creating and managing it from the editor package to the main application (`src/editor.ts`). This way:

- The editor package becomes more flexible and testable
- The main application continues to use the existing `@8f4e/compiler-worker` infrastructure
- The editor package no longer directly imports compiler dependencies
- The compilation logic remains the same, just managed externally

Add an async compile callback function to the editor's Options interface that allows consumers to provide their own compilation strategy. This will:

- Decouple the editor from specific compiler implementations
- Allow consumers to use different compilers or compilation strategies
- Make the editor more testable and flexible
- Reduce the editor's bundle size by removing compiler dependencies

The callback should receive the project data and return compiled modules, code buffer, and memory information.

## Implementation Plan

### Step 1: Update Options Interface
- Add `compileProject: (modules: Module[], compilerOptions: CompileOptions, memoryRef: WebAssembly.Memory) => Promise<CompilationResult>` to the Options interface
- Define a new `CompilationResult` interface with the necessary compilation data:
  ```typescript
  interface CompilationResult {
    compiledModules: CompiledModuleLookup;
    codeBuffer: Uint8Array;
    allocatedMemorySize: number;
  }
  ```
- Update the editor's main entry point to accept this new option
- Make the compile callback mandatory (no fallback to internal compiler)

### Step 2: Refactor Compiler Effect
- Modify `packages/editor/src/state/effects/compiler.ts` to use the provided compile callback instead of creating its own worker
- Remove direct imports from `@8f4e/compiler` and `@8f4e/compiler-worker`
- Update the compilation logic to call the external callback
- Implement error handling: catch errors thrown by the callback and convert them to BuildError format
- Update event dispatching to work with external compilation results

### Step 3: Update State Management
- Modify the compiler state to work with the external compilation results
- Ensure memory buffers and compiled modules are properly handled
- Update error handling to work with external compilation

### Step 4: Update Consumer Examples
- Modify the main application (`src/editor.ts`) to provide the compile callback using the existing `@8f4e/compiler-worker` package
- Ensure the editor still works with the existing compiler implementation
- Update any tests that depend on the current compiler integration

## Success Criteria

- [ ] Editor can be initialized without compiler dependencies
- [ ] Compile callback is properly called when compilation is needed
- [ ] Editor works with external compilation results
- [ ] Compile callback is mandatory (no fallback to internal compiler)
- [ ] Error handling works correctly: callback throws errors, editor catches and converts to BuildError format
- [ ] Bundle size is reduced by removing compiler dependencies
- [ ] Tests pass with external compilation
- [ ] **Main application continues to use `@8f4e/compiler-worker` package as before**

## Affected Components

- `packages/editor/src/state/types.ts` - Add compile callback to Options interface
- `packages/editor/src/state/effects/compiler.ts` - Refactor to use external callback
- `packages/editor/src/index.ts` - Update main entry point
- `src/editor.ts` - Update main application to provide compile callback using compiler-worker
- `packages/editor/src/state/index.ts` - Update state initialization

## Risks & Considerations

- **Risk 1**: Breaking existing functionality if the callback interface is not properly designed
  - **Mitigation**: Maintain backward compatibility and provide sensible defaults
- **Risk 2**: Performance impact from external compilation calls
  - **Mitigation**: Ensure the callback is async and doesn't block the main thread
- **Dependencies**: The compile callback must provide compatible data structures
- **Breaking Changes**: Minimal - the change should be additive to existing Options
- **Important**: The `@8f4e/compiler-worker` package will continue to be used by the main application, just not directly imported by the editor package

## Related Items

- **Depends on**: None
- **Related**: 
  - `todo/015-lazyload-runtimes.md` - Similar pattern for runtime loading
  - `todo/019-pass-runtime-instances-through-options.md` - Similar pattern for runtime configuration

## References

- [Current compiler implementation](packages/editor/src/state/effects/compiler.ts)
- [Editor Options interface](packages/editor/src/state/types.ts)
- [Main editor entry point](packages/editor/src/index.ts)
- [Main application that will provide compile callback](src/editor.ts)

## Notes

This refactoring follows the same pattern used for runtime loading, where the editor accepts callbacks for external functionality rather than directly importing and managing dependencies. This approach makes the editor more modular and easier to integrate into different environments.

**Key Clarification**: The goal is to move the compiler worker management from the editor package to the main application, NOT to replace the compiler worker entirely. The main application will continue to use the `@8f4e/compiler-worker` package and provide a compile callback to the editor.

The compile callback should handle:
- Project code compilation using the existing compiler worker infrastructure
- Memory allocation and management (including WebAssembly.Memory creation)
- Binary asset handling
- Throwing errors on compilation failure (editor handles error conversion and display)

**Key Design Decisions:**
- Compile callback is mandatory - no fallback to internal compiler
- Callback throws errors on failure, editor catches and converts to BuildError format
- Callback handles both compilation and memory allocation for cleaner separation of concerns
- Full CompileOptions interface is maintained for maximum flexibility
- **The `@8f4e/compiler-worker` package remains the primary compilation engine, just managed externally**

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 