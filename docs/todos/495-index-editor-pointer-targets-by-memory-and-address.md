---
title: 'TODO: Index editor pointer targets by memory and address'
priority: Medium
effort: 3-6h
created: 2026-10-14
issue: https://github.com/andorthehood/8f4e/issues/1012
status: Open
completed: null
---

# TODO: Index editor pointer targets by memory and address

## Problem Description

When `resolveMemoryIdentifier` dereferences a pointer, it filters the memory plan's module list by memory index,
flattens their declarations, and searches for the declaration whose `byteAddress` equals the pointer value.
Every such lookup repeats these scans and allocates temporary arrays.

Pointer-based widgets can repeat this work during block derived-state updates. Projects with many declarations
could benefit from an address index, but the effect on editor latency has not yet been measured.

## Proposed Solution

Build a secondary index of planned declarations using nested Maps keyed by memory index and byte address. Reuse
the index for pointer-target resolution and rebuild or invalidate it whenever the memory plan changes.

Read the current pointer value on every resolution. Cache declaration lookup data, not pointer values or resolved
targets, because runtime memory can change without recompilation.

## Implementation Plan

1. Measure pointer resolution with many declarations and multiple pointer-based widgets; record baseline results.
2. Index declarations once per memory plan while preserving module/declaration traversal order for duplicate addresses.
3. Replace the filter/flatten/find chain with lookup by the effective pointee memory index and current pointer value.
4. Cover memory-plan replacement, cross-memory resolution, duplicate addresses, and changing pointer values, then
   repeat the benchmark including index construction and retained memory.

## Success Criteria

- [ ] Pointer-target lookup avoids repeated module filtering, declaration flattening, and linear address searches.
- [ ] Identical byte addresses in different memories resolve independently.
- [ ] Explicit pointee memory metadata and the existing fallback memory index retain their semantics.
- [ ] Runtime pointer changes are reflected immediately without rebuilding the index.
- [ ] Unknown addresses, address zero, duplicate addresses, recompilation, and project replacement behave correctly.
- [ ] Measurements establish the benefit and maintenance cost on representative large projects.

## Affected Components

- `packages/editor/packages/editor-core/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts`
- `packages/editor/packages/editor-core/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.test.ts`
- `packages/editor/packages/editor-core/packages/editor-state/src/features/program-compiler/effect.ts`
- Editor state types/defaults if the index lives in state, and directive widget consumers of memory resolution.

## Risks & Considerations

- Multiple declarations may share a base address, especially empty declarations or aliases. Preserve the first
  matching declaration from the current module/declaration order rather than overwriting it with a later Map entry.
- Address units must remain consistent: this lookup compares `byteAddress` with the pointer's value.
- A stale index must never retain declarations from a previous memory plan or project.

## Validation Checkpoints

- Run `npx nx run @8f4e/editor-state:test` and affected typechecks.
- Verify pointer-based widgets after recompilation and while the runtime changes the pointer's target.

## Related Items

- [Index compiled functions by project block ID](493-index-compiled-functions-by-project-block-id.md) also introduces
  a compilation-derived editor index; share lifecycle conventions where useful without coupling the two changes.
