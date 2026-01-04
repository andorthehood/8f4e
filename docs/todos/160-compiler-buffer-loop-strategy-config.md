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

## Proposed API
- Add to `CompileOptions`:
  - `bufferSize?: number` (default 128)
  - `bufferStrategy?: 'loop' | 'unrolled'` (default 'loop')

## Implementation Plan
1. Add `bufferSize` and `bufferStrategy` to `CompileOptions` in `packages/compiler/src/types.ts` with defaults applied in the compiler entrypoint.
2. Introduce a helper under a new `packages/compiler/src/wasmBuilders/` directory (e.g., `createBufferFunctionBody.ts`) that returns the buffer function body bytes for both strategies.
3. Update `packages/compiler/src/index.ts` to call the helper and pass options, keeping it minimal.
4. Update existing tests and snapshots that include the exported `buffer` function to reflect looped default behavior.
5. Add focused tests that validate both strategies and custom buffer sizes (loop and unrolled).
6. Update docs/notes describing buffer size configuration and loop strategy, keeping prior rationale and adding new option notes.

## Open Questions
- Exact naming: `bufferStrategy` vs `bufferLoopMode` vs `bufferUnroll` (current leaning: `bufferStrategy`).
- Should there be validation or warnings for very large `bufferSize` values? (current direction: no cap)

## Risks
- Snapshot churn in compiler instruction tests.
- Performance regression risk vs unrolled implementation (mitigate with follow-up benchmarks).
