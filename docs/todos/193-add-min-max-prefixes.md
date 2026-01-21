---
title: 'TODO: Add Min/Max Value Prefixes for Memory Items'
priority: Medium
effort: 4-6h
created: 2026-01-21
status: Open
completed: null
---

# TODO: Add Min/Max Value Prefixes for Memory Items

## Problem Description

8f4e has identifier prefixes for memory-derived values (e.g., element count and word size), but there is no concise way to access type bounds for a given memory item. Users currently have to hardcode magic numbers (e.g., 32767 for int16 max), which is error-prone and obscures intent.

## Proposed Solution

Introduce two new identifier prefixes that resolve to the max finite value and the lowest finite value for a memory item’s element type, analogous to C-style limits for floats.

Recommended prefixes:
- `^name` => max finite value for the element type of `name`
- `!name` => lowest finite value for the element type of `name`

Semantics:
- For `int` and `int[]`:
  - `int`/`int32` => max 2,147,483,647; lowest -2,147,483,648
  - `int16[]` => max 32,767; lowest -32,768
  - `int8[]` => max 127; lowest -128
- For `float` and `float[]`:
  - max finite and lowest finite float32 values (not Infinity, not smallest positive).
- Scalars use the same rules (element size of 4 bytes).

These should behave like existing `$name` and `%name` prefixes: they are resolved during `push` compilation and push a literal onto the stack.

## Implementation Plan

### Step 1: Add syntax helpers
- Add `hasElementMaxPrefix` / `extractElementMaxBase` and `hasElementMinPrefix` / `extractElementMinBase` in `packages/compiler/src/syntax/`.
- Add identifier checks in `packages/compiler/src/utils/memoryIdentifier.ts` (mirroring `$` and `%`).

### Step 2: Extend `push` compiler
- Update `packages/compiler/src/instructionCompilers/push.ts` to detect the new prefixes.
- Compute values using the memory map item’s `elementWordSize` and `isInteger` flags.
- For float32 bounds, use explicit constants (max finite and lowest finite).

### Step 3: Tests and snapshots
- Add unit tests for new syntax helpers.
- Add `push` instruction compiler tests that snapshot max/min values for int8/int16/int32 and float32 cases.

### Step 4: Documentation
- Update `packages/compiler/docs/prefixes.md` with new prefixes.
- Link if needed from `packages/compiler/docs/instructions/stack.md` and `packages/compiler/docs/instructions/memory.md` (already linked to prefixes doc).

## Success Criteria

- [ ] `push ^name` and `push !name` compile and evaluate to the correct values for int8/int16/int32/float32.
- [ ] Works for both scalars and buffers.
- [ ] Documentation updated with examples and semantics.
- [ ] Tests added and passing.

## Affected Components

- `packages/compiler/src/instructionCompilers/push.ts`
- `packages/compiler/src/utils/memoryIdentifier.ts`
- `packages/compiler/src/utils/memoryData.ts` (optional helper for bounds)
- `packages/compiler/src/syntax/*` (new helpers)
- `packages/compiler/docs/prefixes.md`

## Risks & Considerations

- **Prefix collisions**: `^` and `!` are currently unused in identifiers; confirm no existing syntax conflicts.
- **Float semantics**: Ensure “lowest” matches most negative finite float32, not smallest positive.
- **Pointer types**: Prefixes should operate on the declared memory item element type, not pointer target types (match current `$`/`%` behavior).

## Related Items

- **Related**: `packages/compiler/docs/prefixes.md` and the existing `$`/`%` prefix handling in `push`.

## Notes

- This should be implemented in the compiler only; editor does not need changes beyond documentation.
- Use constants for float bounds to avoid any dependence on JS runtime semantics.

