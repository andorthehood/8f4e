---
title: 'TODO: Add float64 live memory patching in compiler-worker'
priority: Medium
effort: 4-8h
created: 2026-02-19
status: Completed
completed: 2026-02-19
---

# TODO: Add float64 live memory patching in compiler-worker

## Problem Description

`compileAndUpdateMemory` applies incremental default-value changes directly into wasm memory without full re-init.

Current implementation only patches via:
- `Int32Array` for integer memory
- `Float32Array` for non-integer memory

This is insufficient for float64-backed memory (`elementWordSize === 8`), so incremental updates can write incorrect values/addresses for float64 defaults.

## Proposed Solution

Extend compiler-worker incremental patching to support float64 memory items explicitly.

Key changes:
- Carry float width/type metadata in memory change records (not just `isInteger`).
- Add a float64 write path using `Float64Array` (or `DataView.setFloat64` with little-endian).
- Preserve existing int32/float32 behavior.

Scope:
- compiler-worker live patching path only (`needsInitialization === false` branch).
- change-record typing needed to route correct writer.

Out of scope:
- compiler allocation/type-system changes unrelated to patching,
- full runtime execution semantics outside default patching.

## Anti-Patterns

- Do not route all non-integer values to `Float32Array`.
- Do not infer float64 only from JS number magnitude; use memory metadata (`elementWordSize` / type flag).
- Do not force full `init()` just to avoid implementing float64 patching.

## Implementation Plan

### Step 1: Extend memory change metadata
- Update `MemoryValueChange` shape (and producers) to include float width/type information sufficient for patch routing.
- Ensure object/default-array change cases carry the same metadata.

### Step 2: Add float64 patch writer path
- In `compileAndUpdateMemory`, create/update float64 writer view and branch:
  - int -> Int32Array path
  - float32 -> Float32Array path
  - float64 -> Float64Array/DataView path
- Ensure index math uses correct element width for float64 writes.

### Step 3: Add tests
- Add compiler-worker tests for incremental recompiles where only float64 defaults change.
- Include scalar and buffer/object-default cases.
- Verify `initOnly` rerun behavior remains correct after float64 patches.

## Validation Checkpoints

- `rg -n "compileAndUpdateMemory|getMemoryValueChanges|MemoryValueChange|Float32Array|Int32Array" /Users/andorpolgar/git/8f4e/packages/compiler-worker/src`
- `npx nx run @8f4e/compiler-worker:test -- --run "compileAndUpdateMemory|memoryValueChanges"`

## Success Criteria

- [ ] Incremental default patches correctly update float64 memory values.
- [ ] Existing int32 and float32 patch behavior remains unchanged.
- [ ] Scalar and array/object float64 defaults are both covered by tests.
- [ ] `initOnly` rerun trigger remains based on detected default changes, not value type.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler-worker/src/compileAndUpdateMemory.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler-worker/src/getMemoryValueChanges.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler-worker/src/types.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler-worker/src/__tests__`

## Risks & Considerations

- **Risk 1**: Incorrect indexing when switching between 4-byte and 8-byte element views.
  - Mitigation: drive writes from byte address / element size metadata, with explicit tests.
- **Risk 2**: Regressions in existing int32/float32 incremental patch logic.
  - Mitigation: keep current tests and add targeted regression coverage for old paths.

## Related Items

- **Depends on**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/258-add-f64-store-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/255-add-float64-memory-view-to-web-ui.md`

## Notes

- This TODO addresses the live update path only; full wasm execution correctness is handled by instruction/compiler TODOs.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
