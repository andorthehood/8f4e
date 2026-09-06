---
title: 'TODO: Simplify map codegen with reverse row order'
priority: Medium
effort: 2-4h
created: 2026-09-06
issue: null
status: Open
completed: null
---

# TODO: Simplify Map Codegen With Reverse Row Order

## Problem Description

The compiler emits branchless WebAssembly for `mapBegin` / `map` / `mapEnd` blocks, with the first matching source
row taking precedence. The current implementation allocates four temporary locals: input, result, matched, and
condition. Every row updates the matched flag and checks it before selecting a result.

This bookkeeping adds runtime instructions and emitted bytes even though map keys and values are compile-time
constants. It can be removed while preserving first-match-wins behavior.

## Proposed Solution

Emit map rows in reverse source order, retaining only the input and result locals:

1. Save the input and initialize the result to the explicit default or the existing typed zero.
2. Iterate from the last row to the first without mutating the source row array.
3. For each row, emit `result = select(row.value, result, input == row.key)`.
4. Push the final result.

Earlier source rows execute last and overwrite later matches, so duplicate keys still select the first source row.
Keep the existing zero-row path, which drops the input and pushes the default. Preserve the existing input and output
type handling for `int`, `float`, and `float64`.

No public API or language syntax change is required. Keep this task focused on map lowering.

## Preliminary Measurements

An isolated experiment on 2026-09-06 compared the current lowering with reverse-order emission on Node 24.16.0.
Each timing sample made one million calls to an exported integer lookup function. Two runs used alternating variant
order, discarded warmup rounds, and compared median timings. Fixtures included a duplicate key and an explicit default;
both variants returned the expected values for matching and nonmatching inputs and produced valid WebAssembly.

| Rows | Observed runtime improvement | Complete fixture Wasm size, before → after |
| ---- | ---------------------------- | ------------------------------------------------ |
| 4 | Little difference | 233 → 163 bytes |
| 16 | About 3.3× faster | 563 → 315 bytes |
| 64 | About 2.3–2.4× faster | 1,907 → 939 bytes |

These are exploratory microbenchmarks, not whole-application speedups or acceptance thresholds. Reproduce the comparison
with a retained benchmark fixture during implementation; the initial scripts were temporary. Floating-point behavior
was not covered by the initial experiment.

## Implementation Plan

- Replace forward iteration and matched/condition bookkeeping in `mapEnd.ts` with reverse-order selection.
- Remove the two unused local allocations and opcode imports; update the lowering explanation.
- Add focused runtime coverage and update bytecode snapshots for the intentional output change.
- Retain a reproducible benchmark for small and larger maps, recording runtime and emitted size.

## Success Criteria

- [ ] Nonempty maps allocate only input and result temporaries.
- [ ] First-match-wins behavior is preserved for duplicate keys.
- [ ] Empty maps, one-row maps, unmatched inputs, explicit defaults, and implicit typed-zero defaults behave as before.
- [ ] Integer, float32, and float64 input/output combinations retain their existing behavior.
- [ ] Float coverage includes NaN inputs, signed-zero keys and results, and distinct source keys that encode to the same
      float32 value; preserve Wasm comparison behavior rather than deduplicating keys using JavaScript equality.
- [ ] Generated Wasm validates and runtime results match the existing lowering.
- [ ] Snapshots demonstrate removal of matched/condition bookkeeping, and repeated benchmarks record the actual gain.

## Affected Components

- `packages/compiler/packages/wasm-codegen/src/instructionCompilers/mapEnd.ts`
- `packages/compiler/packages/wasm-codegen/src/instructionCompilers/mapEnd.test.ts` and its snapshots
- `packages/compiler/tests/instructions/map.test.8f4e` and its compile-result snapshot

## Validation Checkpoints

- `npx nx run @8f4e/wasm-codegen:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run-many --target=typecheck --projects=@8f4e/wasm-codegen,@8f4e/compiler`
- Compare baseline and optimized runtime and Wasm size using the same fixtures and runtime version.

## Related Items

- [TODO 273: Add map block instruction family](archived/273-add-map-block-instruction-family.md)
