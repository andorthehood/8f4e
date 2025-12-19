---
title: 'TODO: Add Non-Zero Guardrails for `remainder`'
priority: Medium
effort: 1-2h
created: 2025-12-19
status: Open
completed: null
---

# TODO: Add Non-Zero Guardrails for `remainder`

## Problem Description

The compiler currently enforces a compile-time “possible division by zero” guard for `div`, using the `isNonZero` stack flag. The `remainder` instruction lowers to `i32.rem_s` but does not enforce the same guardrails.

This means code that can statically produce a zero divisor can compile successfully and then trap at runtime.

## Proposed Solution

Mirror `div`’s guard semantics in `remainder`:
- If the divisor stack item is not provably non-zero, throw `ErrorCode.DIVISION_BY_ZERO`.
- Preserve existing operand type constraints (integers only) and keep `remainder`’s output `isNonZero: false`.

## Implementation Plan

### Step 1: Update instruction compiler
- Add a `isNonZero` check for the divisor in `packages/compiler/src/instructionCompilers/remainder.ts`.
- Reuse `ErrorCode.DIVISION_BY_ZERO` to match existing guard behavior and error messaging.

### Step 2: Add unit tests
- Add tests that assert compilation fails when divisor may be zero.
- Add tests that assert compilation succeeds when divisor is made non-zero via `ensureNonZero`.

## Success Criteria

- [ ] `remainder` compilation fails with `ErrorCode.DIVISION_BY_ZERO` when divisor is possibly zero
- [ ] `remainder` compilation succeeds when divisor is provably non-zero (e.g., after `ensureNonZero`)
- [ ] `nx run compiler:test` passes

## Affected Components

- `packages/compiler/src/instructionCompilers/remainder.ts` - add non-zero divisor guard
- `packages/compiler/tests/*` - add guardrail tests

## Risks & Considerations

- **Error semantics**: message says “Possible division by zero”; confirm it’s acceptable for remainder as well.
- **False positives**: `isNonZero` is conservative by design; this may surface new compile-time failures that require `ensureNonZero` or refactors.

## Related Items

- **Related**: `packages/compiler/src/instructionCompilers/div.ts`
- **Related**: `packages/compiler/src/instructionCompilers/ensureNonZero.ts`

