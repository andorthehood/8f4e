# TODO: Pass Runtime Instances Through initEditor Options

**Priority**: 🔴  
**Estimated Effort**: 3-4 days  
**Created**: 2025-08-26
**Status**: Open  
**Completed**: 2025-08-26

## Problem Description

Currently, the editor has baked-in runtime instances (AudioWorkletRuntime, WebWorkerLogicRuntime, WebWorkerMIDIRuntime) that are dynamically loaded using dynamic imports when needed. This approach has several fundamental issues:

- Runtime instances are hardcoded into the editor package, creating tight coupling
- No way to pass custom runtime instances with different implementations
- Runtime instances are created internally by the editor and cannot be customized by consumers
- Difficult to test with mock runtime instances
- No way to share runtime instances across multiple editor instances
- Editor package becomes bloated with runtime-specific code and business logic
- Impossible to use the editor without these specific runtime implementations
- Runtime business logic is tightly coupled to the editor (e.g., MIDI handling, audio processing, worker logic)

The current architecture loads runtimes from `packages/editor/src/state/effects/runtimes/` using dynamic imports, which makes the editor package dependent on specific runtime implementations and prevents consumers from providing their own. Additionally, important business logic like MIDI message handling is embedded within the editor package.

## Proposed Solution

Completely eliminate the baked-in runtime instances and modify the `initEditor` function to use an async callback for runtime requests. This will:

1. **Remove all hardcoded runtime implementations** from the editor package
2. **Use async callback pattern** for runtime requests instead of pre-loaded instances
3. **Eliminate dynamic imports** of runtime-specific code
4. **Make the editor package runtime-agnostic** and lightweight
5. **Enable complete customization** of runtime implementations
6. **Improve testability** by allowing mock runtime instances
7. **Reduce bundle size** by removing unused runtime code
8. **Provide flexibility** in how consumers load and manage runtime instances

The solution will:
- Remove the `packages/editor/src/state/effects/runtimes/` directory entirely
- Add `requestRuntime: (runtimeType: RuntimeType) => Promise<RuntimeFactory>` to the `Options` interface
- Eliminate all fallback mechanisms - if a runtime is not available, throw an error
- Give consumers complete control over how they load, cache, and manage runtime instances

## Implementation Plan

### Step 1: Extend Options Interface
- Add `requestRuntime: (runtimeType: RuntimeType) => Promise<RuntimeFactory>` to the `Options` interface in `packages/editor/src/state/types.ts`
- Ensure the callback signature is compatible with the existing `RuntimeFactory` type

### Step 2: Replace Dynamic Runtime Loading with Callback
- Remove the `loadRuntime` function entirely from `packages/editor/src/state/effects/runtime.ts`
- Remove the `runtimeLoaders` mapping and dynamic import logic
- Replace with logic that calls the `requestRuntime` callback from options
- If the callback fails or returns undefined, throw an error immediately
- No fallback mechanisms - runtime must be available or error is thrown

### Step 3: Update State Initialization
- Modify `packages/editor/src/state/index.ts` to pass the `requestRuntime` callback from options to the runtime effects
- Ensure the callback is properly passed through the state initialization chain
- Remove all handling for dynamic loading fallbacks

### Step 4: Update Editor Initialization
- Modify `packages/editor/src/index.ts` to pass the `requestRuntime` callback from options to state initialization
- Ensure the callback is properly integrated with the editor's event system

### Step 5: Outsource Runtime Business Logic
- **Extract MIDI message handling logic** from WebWorkerMIDIRuntime to separate modules
- **Extract audio processing logic** from AudioWorkletRuntime to separate modules  
- **Extract worker logic** from WebWorkerLogicRuntime to separate modules
- **Create clean interfaces** for each type of business logic
- **Separate concerns** between runtime orchestration and business logic implementation

### Step 6: Update Main Entry Point
- Modify `src/editor.ts` to demonstrate how to implement the `requestRuntime` callback
- Move all three currently used runtimes (AudioWorkletRuntime, WebWorkerLogicRuntime, WebWorkerMIDIRuntime) from `packages/editor/src/state/effects/runtimes/` to `src/editor.ts`
- Show examples of loading runtimes dynamically, from cache, or any other strategy
- Remove any references to dynamic loading or fallback mechanisms

## Success Criteria

- [ ] `Options` interface includes required `requestRuntime` callback property
- [ ] Editor can request runtimes through the callback
- [ ] All baked-in runtime implementations are completely removed
- [ ] No fallback mechanisms exist - errors are thrown if runtime unavailable
- [ ] Runtime instances properly integrate with editor's state and event system
- [ ] Editor package becomes runtime-agnostic and lightweight
- [ ] **Runtime business logic is separated** from runtime orchestration
- [ ] **Clean interfaces exist** for MIDI, audio, and worker logic
- [ ] Unit tests pass for new functionality
- [ ] Documentation is updated with examples and migration guide
- [ ] Bundle size is reduced by removing runtime-specific code

## Affected Components

- `packages/editor/src/state/types.ts` - Add requestRuntime callback to Options interface
- `packages/editor/src/state/effects/runtime.ts` - Replace dynamic loading with callback calls
- `packages/editor/src/state/index.ts` - Pass requestRuntime callback to runtime effects
- `packages/editor/src/index.ts` - Pass requestRuntime callback to state initialization
- `packages/editor/src/state/effects/runtimes/` - **REMOVE ENTIRE DIRECTORY**
- `src/editor.ts` - Demonstrate implementation of requestRuntime callback
- Test files - Add tests for new callback functionality
- Package dependencies - Remove runtime package dependencies from editor

## Risks & Considerations

- **Breaking Changes**: This is a breaking change - existing code will need to be updated to provide runtime instances
- **Migration Required**: All consumers must migrate to provide their own runtime implementations
- **Type Safety**: Need to ensure runtime instances conform to the expected `RuntimeFactory` interface
- **Event Integration**: Runtime instances must properly integrate with the editor's event system
- **Memory Management**: Runtime instances need proper cleanup when editor is destroyed
- **Dependencies**: Runtime instances may have their own dependencies that need to be managed
- **Documentation**: Need comprehensive migration guide for existing users

## Related Items

- **Depends on**: Current runtime architecture (to be removed)
- **Related**: Runtime management, state initialization, editor configuration
- **Future**: Could enable plugin system for custom runtime implementations
- **Migration**: All existing projects using the editor will need updates

## References

- [Current runtime implementation](packages/editor/src/state/effects/runtime.ts)
- [Runtime type definitions](packages/editor/src/state/types.ts)
- [AudioWorkletRuntime example](packages/editor/src/state/effects/runtimes/audioWorkletRuntime.ts)
- [WebWorkerLogicRuntime example](packages/editor/src/state/effects/runtimes/webWorkerLogicRuntime.ts)
- [WebWorkerMIDIRuntime example](packages/editor/src/state/effects/runtimes/webWorkerMIDIRuntime.ts)

## Notes

This implementation will completely decouple the editor from runtime implementations, making the system truly modular and runtime-agnostic. The approach requires a breaking change but provides significant benefits:

- **Clean Architecture**: Editor becomes a pure UI component without runtime dependencies
- **Flexibility**: Consumers have complete control over how runtimes are loaded and managed
- **Bundle Size**: Editor package becomes significantly smaller
- **Testability**: Easy to test with mock runtime instances
- **Customization**: No limitations on runtime implementations
- **Loading Strategy**: Consumers can implement any loading strategy (dynamic imports, caching, CDN, etc.)

The solution follows the existing patterns in the codebase and integrates seamlessly with the current event-driven architecture, but removes the tight coupling to specific runtime implementations.

**Migration Impact**: This is a breaking change that will require all existing consumers to implement a `requestRuntime` callback. A comprehensive migration guide will be essential.

**Design Benefits**: The callback approach is superior to pre-loaded instances because:
- Consumers can implement their own caching strategies
- Runtimes can be loaded on-demand only when needed
- Different loading strategies can be used (dynamic imports, CDN, bundled, etc.)
- Memory usage is optimized by not loading unused runtimes

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 