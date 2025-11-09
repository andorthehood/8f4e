---
title: 'TODO: Make WebAssembly memory sizing project-specific'
priority: Medium
effort: 2-3d
created: 2025-11-05
status: Completed
completed: null
---

# TODO: Make WebAssembly memory sizing project-specific

## Problem Description

The editor kernel always allocates a fixed `WebAssembly.Memory` of 1000 initial pages with a 10000 page ceiling, regardless of project needs. These values live in the editor-state defaults (`packages/editor/packages/editor-state/src/index.ts`) and are reapplied on every load (`packages/editor/packages/editor-state/src/effects/loader.ts`). Projects that require larger buffers must patch the source, while lean projects waste significant memory headroom. This hardcoded strategy blocks per-project tuning, complicates exports, and risks out-of-memory faults for ambitious patches.

## Proposed Solution

Allow projects to declare their preferred WASM memory configuration in project data, and have the editor respect those values when compiling or instantiating runtimes. Extend the project schema with an optional memory block storing initial and maximum page counts. During initialization and project load, derive compiler options and `WebAssembly.Memory` construction from that block, falling back to the legacy defaults when absent. Ensure the configuration is persisted through save/export paths so runtime-ready payloads mirror the chosen limits.

## Implementation Plan

### Step 1: Extend project schema
- Add a `memory` property (with `initialPages` and `maxPages`) to `Project` in `packages/editor/packages/editor-state/src/types.ts`
- Update `EMPTY_DEFAULT_PROJECT` to provide fallback values only when the property is missing
- Propagate typings to any consumers relying on the project model

### Step 2: Wire editor state to per-project settings
- Remove hardcoded memory constants in `packages/editor/packages/editor-state/src/index.ts`
- In `packages/editor/packages/editor-state/src/effects/loader.ts`, read the project memory config (with defaults) before recreating `WebAssembly.Memory`
- Synchronize `state.compiler.compilerOptions` with the resolved values for downstream consumers

### Step 3: Persist and document the configuration
- Update mocks/tests (e.g., `runtimeReadyProject.test.ts`, `generateStateMock.ts`) to cover both defaulted and customized memory settings
- Ensure save/export paths serialize the memory block so runtime-ready bundles preserve the configuration
- Document the new project fields in `docs/usage.md` and any API reference materials

## Success Criteria

- [ ] Projects may specify custom WASM memory page counts without modifying source constants
- [ ] Loader and compiler use per-project settings, with defaults applied when unspecified
- [ ] Runtime-ready exports include the configured memory values and instantiate correctly
- [ ] Updated tests cover default and customized scenarios

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` – extend `Project` model and defaults
- `packages/editor/packages/editor-state/src/index.ts` – replace hardcoded compiler memory options
- `packages/editor/packages/editor-state/src/effects/loader.ts` – create `WebAssembly.Memory` from project data
- `packages/editor/packages/editor-state/src/effects/compiler.ts` – ensure compiler options use per-project values
- `packages/editor/packages/web-ui/screenshot-tests/utils/generateStateMock.ts` – adjust mock state to include memory overrides
- `docs/usage.md` – document the new project memory configuration

## Risks & Considerations

- **Backward compatibility**: Legacy project files lacking the memory block must still load with default sizing
- **Validation**: Need sanity checks to avoid invalid page counts (e.g., `initial > max` or exceeding engine limits)
- **Export consistency**: Runtime-ready exports should not regress when consuming the new configuration
- **Testing surface**: Additional test coverage required to avoid regressions in compiler-worker and runtimes

## Related Items

- **Related**: TODO-069 (extract editor-state package), as schema changes may impact packaging plans
- **Related**: TODO-074 (consolidate code block render loop), since renderers depend on predictable memory initialization for assets

## References

- WebAssembly memory parameter docs: https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory
- Current loader instantiation: `packages/editor/packages/editor-state/src/effects/loader.ts`
- Compiler options definition: `packages/compiler/src/types.ts`

## Notes

- Consider future-proofing for projects needing `shared` toggles or finer-grained memory controls
- Coordinate with runtime teams to ensure worklets/workers honor the shared memory semantics after the change
