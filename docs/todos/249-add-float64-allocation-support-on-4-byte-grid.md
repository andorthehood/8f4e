---
title: 'TODO: Add float64 allocation support on 4-byte grid'
priority: Medium
effort: 2-4d
created: 2026-02-19
status: Open
completed: null
---

# TODO: Add float64 allocation support on 4-byte grid

## Problem Description

The current memory model is centered around a 4-byte allocation grid (`GLOBAL_ALIGNMENT_BOUNDARY = 4`), which maps cleanly to `Int32Array`/`Float32Array` views and word-based pointer math.

This works well for `int32`/`float32`, but there is no first-class allocation path for `float64` data structures yet.

Without explicit `float64` allocation support:
- we cannot safely reserve 8-byte elements in memory maps,
- we risk ad-hoc addressing assumptions when trying to prototype 64-bit paths,
- and future runtime/view work has no stable allocator contract to build on.

## Proposed Solution

Add an allocation-only phase for `float64` while preserving the existing 4-byte global grid.

Scope for this TODO (explicit):
- In scope: scalar `float64` declaration allocation.
- In scope: array `float64[]` allocation.
- In scope: pointer declarations `float64*` and `float64**` allocation metadata.
- In scope: correct memory-map metadata (`elementWordSize`, `wordAlignedSize`, `wordAlignedAddress`, `byteAddress`) for both.
- Out of scope: runtime arithmetic/casts and execution semantics for `float64`.
- Out of scope: load/store instruction behavior beyond allocation metadata.

Key ideas:
- Keep the global grid at 4 bytes (do not migrate the whole system to an 8-byte grid).
- Represent `float64` as `elementWordSize = 8`, so each element consumes 2 grid words.
- Enforce 8-byte start alignment for `float64` memory items (`byteAddress % 8 === 0`) so `Float64Array`/`DataView` access is safe.
- Continue rounding allocation size to the 4-byte boundary (`wordAlignedSize = ceil(bytes / 4)`).

This first step only guarantees safe memory reservation and addressing metadata. It does not include `f64.load/store` execution support yet.

## Anti-Patterns

- Do not switch the entire memory model from 4-byte to 8-byte grid just to support `float64`.
- Do not treat `float64` like existing `float`/`float[]` paths without updating element size metadata.
- Do not couple allocation-only rollout with full runtime arithmetic/cast changes in a single step.

## Implementation Plan

### Step 1: Extend memory type surface for allocation
- Add `float64` family entries to compiler memory type metadata.
- Accept scalar `float64` declarations in declaration compilers.
- Accept `float64*` / `float64**` declarations in declaration compilers with correct pointer flags.
- Accept `float64[]` as a declaration instruction mapped to buffer allocation.
- Outcome: parser/compiler can represent scalar, pointer, and array float64 declarations in the memory map.

### Step 2: Implement allocator semantics
- Update scalar allocation logic so `float64` resolves to `elementWordSize = 8`.
- Ensure `float64*` / `float64**` retain pointer-width allocation semantics while preserving correct float64 pointer typing metadata.
- Update buffer allocation logic so `float64[]` resolves to `elementWordSize = 8`.
- Keep `wordAlignedSize` computation on 4-byte units.
- Ensure `float64` declarations only start on even word offsets (2-word boundary) to guarantee 8-byte byte-address alignment.
- Outcome: `float64` scalars, pointers, and buffers reserve/encode correct metadata without breaking existing pointer math.

### Step 3: Add focused tests and docs
- Add compiler tests for mixed allocations and expected `wordAlignedAddress`/`byteAddress` progression.
- Add a dedicated alignment regression test that declares an odd number of `int32` elements between two `float64` declarations and verifies the second `float64` is still 8-byte aligned.
- Update docs/comments to clarify why allocation stays on the 4-byte grid and where rounding occurs.
- Outcome: allocation contract is explicit and regression-safe.

## Validation Checkpoints

- `rg -n "float64\\[\\]|float64" /Users/andorpolgar/git/8f4e/packages/compiler/src`
- `npx nx run @8f4e/compiler:test -- --run "buffer|memory|allocation"`
- Verify memory-map snapshots show:
  - scalar `float64` entries exist with `elementWordSize: 8`
  - `float64*` / `float64**` entries exist with correct pointer flags and expected pointer-width allocation
  - `elementWordSize: 8` for `float64[]`
  - `wordAlignedSize` increments in 4-byte words (2 words per `float64` element)
  - `byteAddress % 8 === 0` for every `float64` allocation
  - odd-count `int32` gaps between `float64` allocations do not break 8-byte alignment of subsequent `float64` entries

## Success Criteria

- [ ] Scalar `float64` declarations compile into memory map entries with `elementWordSize = 8`.
- [ ] `float64*` and `float64**` declarations compile into memory map entries with correct pointer flags/metadata.
- [ ] `float64[]` declarations compile into memory map entries with `elementWordSize = 8`.
- [ ] Allocation remains 4-byte-grid-based and address progression is correct in mixed-type layouts.
- [ ] All `float64` allocations are 8-byte aligned and safe for 64-bit view indexing.
- [ ] Tests cover odd `int32` spacing between two `float64` declarations and assert correct byte addresses.
- [ ] Existing `int`/`float` allocation behavior and tests remain unchanged.
- [ ] Comments/docs clearly explain boundary rounding (4-byte words and 64 KiB wasm pages).

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` - memory type definitions.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/index.ts` - instruction registry for `float64` and `float64[]`.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/float.ts` (or equivalent) - scalar float64 allocation metadata.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/memoryFlags.ts` - pointer flag behavior for float64 pointer declarations.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/buffer.ts` - element size and aligned allocation calculations.
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests` and/or in-source tests - allocation/layout coverage.
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/consts.ts` and related comments - alignment rationale.

## Risks & Considerations

- **Risk 1**: Confusing allocation support with execution support.
  - Mitigation: keep scope explicit: allocation metadata only, no f64 opcode/runtime behavior in this TODO.
- **Risk 2**: Accidental regressions in pointer/word-size assumptions.
  - Mitigation: add mixed-layout tests and keep 4-byte grid invariant explicit in code comments.
- **Dependencies**: none required for allocation-only stage.
- **Breaking Changes**: none expected if new types are additive.

## Related Items

- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/146-investigate-index-arithmetic-support.md` (word/byte addressing implications).
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/150-add-test-module-type.md` (test ergonomics for low-level memory behavior).

## Notes

- Current design intentionally uses 4-byte allocation units because runtime/editor memory access heavily relies on 32-bit typed-array views and word-indexed addressing.
- Allocation rounding currently happens in two layers:
  - data structure allocation to 4-byte words,
  - wasm memory import allocation to 64 KiB pages.
- Future TODO can build on this to add full `float64` runtime semantics (`f64.const/load/store`, arithmetic, casts, view integration).

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
