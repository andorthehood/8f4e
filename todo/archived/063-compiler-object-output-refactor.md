# TODO: Compiler Object Output Refactor

**Priority**: 🟡
**Estimated Effort**: 4-5 days
**Created**: 2025-10-10
**Status**: Open
**Completed**: TBD

## Problem Description

`@8f4e/compiler` emits `Map`-based structures (`CompiledModuleLookup`, nested `memoryMap`, `default` maps) that bubble up into the editor and runtime workers. This complicates JSON serialization, snapshotting, and persistence, forcing extra conversion helpers and making API consumers juggle Map operations. We want compiler results to be plain objects that are easier to consume and serialize; typed arrays remain unchanged and are out of scope.

## Proposed Solution

Refactor the compiler so its output (and associated types) use plain object dictionaries instead of `Map`. Revise internal data structures, helpers, and consumers to rely on object semantics (string keys) while retaining behaviour. Numeric keys will be stringified consistently. This eliminates conversion steps and makes the compiler output directly serializable, improving interoperability with the editor’s command queue refactor and storage paths.

## Implementation Plan

### Step 1: Inventory & Design
- Audit all compiler Maps (types, utils, instruction compilers) and document key types and access patterns.
- Decide target object shapes (`Record<string, ...>`), including how to represent numeric offsets.
- Expected outcome: migration notes plus updated type definitions ready for implementation.
- Dependencies or prerequisites: none.

### Step 2: Update Compiler Types
- Modify `packages/compiler/src/types.ts` to replace `CompiledModuleLookup`, `MemoryMap`, namespace collections, and `DataStructure.default` with object-based definitions.
- Update exported types and ensure downstream packages compile with the new signatures.
- Expected outcome: compiler type system reflects object dictionaries.
- Dependencies or prerequisites: Step 1.

### Step 3: Refactor Compiler Implementation
- Replace `new Map` usage, `.get`, `.set`, `.has`, and `forEach` across compiler modules with object helpers (`createDictionary`, `hasOwn`, `Object.values`).
- Ensure inter-module resolution, memory initialisation, and const collection operate on objects.
- Expected outcome: runtime compiler logic runs without Map dependencies.
- Dependencies or prerequisites: Step 2.

### Step 4: Update Consumers & Tests
- Adjust editor and worker code that consumes compiler output to use object accessors.
- Remove temporary map-to-object helpers where applicable.
- Update unit tests and snapshots (compiler + editor) for the new data structure.
- Expected outcome: consumers align with object outputs and tests pass.
- Dependencies or prerequisites: Step 3.

### Step 5: Validation & Cleanup
- Run full test suite (compiler, editor, workers); verify serialized exports (runtime-ready project) contain plain objects.
- Document the API change and note any migration steps for downstream consumers.
- Remove obsolete utility functions and dead code.
- Expected outcome: stable object-based compiler output with documented changes.
- Dependencies or prerequisites: Steps 1-4.

## Success Criteria

- [ ] Compiler build output contains no `Map` instances.
- [ ] Editor/runtime consumers operate on plain objects without conversion helpers.
- [ ] Tests cover numeric key coercion and serialisation.

## Affected Components

- `packages/compiler/src` – Types, compiler pipeline, instruction compilers, utilities.
- `packages/editor/src/state/effects` – Consumers of compiled modules/memory maps.
- `packages/runtime-web-worker-midi/src` – Any Map-based compiler integration.

## Risks & Considerations

- **Risk 1**: Behavioural regressions if Map iteration order assumptions are lost; mitigate by verifying determinism with tests/snapshots.
- **Risk 2**: Numeric-key stringification may break consumers expecting numeric lookups; mitigate with helper accessors or explicit string coercion.
- **Dependencies**: Completion of the map inventory and confirmation from embedding layers that object output is acceptable.
- **Breaking Changes**: Compiler API change; downstream projects must adapt to object-based structures.

## Related Items

- **Related**: `todo/062-editor-command-queue-refactor.md` (pure data flow benefits from object outputs).

## References

- Internal discussion (2025-10-10) about removing Map usage from compiler outputs.
- ECMAScript specification on object property order (for determinism considerations).

## Notes

- Consider introducing shared helper utilities (`createDictionary`, `entries`) for consistency.
- Communicate API change in release notes once merged.
- Scope limited to replacing `Map` structures; existing typed arrays (e.g., `Uint8Array`) stay as-is.

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
