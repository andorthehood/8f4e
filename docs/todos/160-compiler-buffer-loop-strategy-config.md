---
title: 'Plan: Configurable Buffer Generation Strategy (Loop vs Unrolled)'
priority: Medium
effort: 6-10 hours
created: 2025-11-06
status: Planned
completed: null
---

# Plan: Configurable Buffer Generation Strategy (Loop vs Unrolled)

## Goals
- Make buffer generation compile-time configurable between looped and unrolled implementations.
- Add compile-time `bufferSize` support with loop as the default strategy.
- Extract loop generation into a helper to keep `packages/compiler/src/index.ts` smaller.

## Current Behavior (Context)
- The compiler exports three wasm functions: `init`, `cycle`, and `buffer`.
- `buffer` is currently generated as a flat, unrolled sequence of `call cycle` repeated 128 times in `packages/compiler/src/index.ts` (inside the `createCodeSection` call that builds `buffer`).
- Runtime code calls `buffer()` once per audio buffer render and reads/writes audio buffers from wasm memory.
- There is no compile-time `bufferSize` or `bufferStrategy` option in `CompileOptions` yet.

## Proposed API
- Add to `CompileOptions`:
  - `bufferSize?: number` (default 128)
  - `bufferStrategy?: 'loop' | 'unrolled'` (default 'loop')

## Implementation Plan
1. Add `bufferSize` and `bufferStrategy` to `CompileOptions` in `packages/compiler/src/types.ts` with defaults applied in the compiler entrypoint.
2. Create `packages/compiler/src/wasmBuilders/` and add a helper (e.g., `createBufferFunctionBody.ts`) that returns the buffer function body byte array. It should accept `bufferSize` and `bufferStrategy` and emit either:
   - Unrolled: `new Array(bufferSize).fill(call(1)).flat()` (existing behavior).
   - Loop: a counted loop that calls `cycle` `bufferSize` times using a local i32 counter and `br_if`.
3. Update `packages/compiler/src/index.ts` to use the helper instead of inlining the buffer function body.
4. Update snapshots/tests that embed the `buffer` function bytecode or export list to reflect looped default.
5. Add tests to cover:
   - Default behavior: `bufferStrategy = 'loop'` and `bufferSize = 128`.
   - Explicit `bufferStrategy = 'unrolled'` with a custom `bufferSize`.
   - A custom `bufferSize` with loop strategy.
6. Update docs that discuss buffer size and loop unrolling so the new default and options are clear.

## Open Questions
- Exact naming: `bufferStrategy` vs `bufferLoopMode` vs `bufferUnroll` (current leaning: `bufferStrategy`).
- Should there be validation or warnings for very large `bufferSize` values? (current direction: no cap)

## Implementation Details (Loop Strategy)
- Use wasm locals and control flow helpers already present in `packages/compiler/src/wasmUtils`:
  - Locals: `createLocalDeclaration`, `localGet`, `localSet`
  - Consts: `i32const`
  - Control flow: `block`, `loop`, `br_if`, `Instruction.I32_SUB`
- Suggested loop shape (pseudocode):
  - `local.set $i (i32.const bufferSize)`
  - `block`
    - `loop`
      - `call $cycle`
      - `local.set $i (local.get $i - 1)`
      - `local.get $i`
      - `br_if 0` (continue loop if counter != 0)
    - `end`
  - `end`
- Keep `buffer` signature unchanged (`[] -> []`).
- The `buffer` function index remains 2 (after `init` and `cycle`) in the export section.

## Files Likely to Change
- `packages/compiler/src/types.ts` (add compile-time options)
- `packages/compiler/src/index.ts` (use helper for buffer body)
- `packages/compiler/src/wasmBuilders/createBufferFunctionBody.ts` (new helper)
- `packages/compiler/tests/**` and snapshots referencing `buffer` body
- `docs/brainstorming_notes/005-audio-buffer-cycle-length-configuration.md` and `docs/todos/054-benchmark-unrolled-vs-normal-loop-audio-buffer-filler.md` (update defaults and new options)

## Risks
- Snapshot churn in compiler instruction tests.
- Performance regression risk vs unrolled implementation (mitigate with follow-up benchmarks).
