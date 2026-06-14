---
title: 'TODO: Improve function overload mismatch diagnostics'
priority: Medium
effort: 2-4h
created: 2026-06-12
issue: null
status: Completed
completed: 2026-06-13
---

# TODO: Improve Function Overload Mismatch Diagnostics

## Problem Description

When a `call` cannot resolve to a matching overload, the compiler currently reports a generic overload or undefined
function error. During stdlib work this made it harder to tell whether the problem was:

- the function name was missing,
- the overload existed but had a different signature,
- the stack analyzer inferred a different pointer type than expected,
- or the failing symbol was a later helper such as `assertf`.

Polymorphic overloads make exact stack signatures more important, so diagnostics should show enough information to
understand the mismatch without instrumenting the compiler.

## Proposed Solution

Extend function-call diagnostics to include:

- the requested call signature inferred from the current stack,
- the available overload signatures for that function name,
- and, where useful, a compact note for pointer operands showing pointee type and pointer depth.

Example target shape:

```text
No matching function overload: readInterpolated.
Inferred call: readInterpolated(int, int16*, int, float)
Available overloads:
- readInterpolated(int, int*, int, float)
- readInterpolated(int, float*, int, float)
```

## Implementation Plan

### Step 1: Preserve Inferred Signature Details

- Reuse the existing stack-to-function-signature logic used by overload resolution.
- Pass the inferred signature and function name into the diagnostic details.

### Step 2: List Available Overloads

- When the function name exists but no exact overload matches, collect the registered overload signatures for that name.
- Keep the diagnostic concise and deterministic.

### Step 3: Add Tests

- Add coverage for scalar overload mismatch.
- Add coverage for pointer overload mismatch, including a narrow integer pointer such as `int16*`.
- Add coverage that true missing function names still produce the simpler undefined-function path.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:test`
- Add or update diagnostic snapshots for overload mismatch cases.

## Success Criteria

- [x] Failed overload resolution reports the inferred call signature.
- [x] Failed overload resolution lists available overload signatures for the called name.
- [x] Missing function names still report as undefined functions.

## Affected Components

- `packages/compiler/src/stackAnalysis/instructionAnalyzers/call.ts` - overload resolution diagnostics.
- `packages/compiler/src/compilerError.ts` - diagnostic formatting.
- `packages/compiler/tests/errors/**` or targeted compiler tests - regression coverage.

## Risks & Considerations

- **Noise**: diagnostics should stay compact for functions with many overloads.
- **Stability**: available overloads should be sorted or emitted in registry order to keep snapshots stable.
- **Privacy of internal ids**: user-facing messages should use source-level signatures, not encoded function ids.

## Related Items

- **Related**: `docs/todos/archived/435-add-polymorphic-function-overloads.md`
