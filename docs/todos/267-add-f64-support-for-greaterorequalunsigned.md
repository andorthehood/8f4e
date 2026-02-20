---
title: 'TODO: Add float64 support for greaterOrEqualUnsigned instruction'
priority: High
effort: 1-3h
created: 2026-02-20
status: Open
completed: null
---

# TODO: Add float64 support for greaterOrEqualUnsigned instruction

## Problem Description

`greaterOrEqualUnsigned` is missing explicit float64 support in the compiler instruction path.

## Proposed Solution

Emit `F64_GE` for float64 operands while preserving existing unsigned-int behavior and mixed-width validation.

## Implementation Plan

### Step 1: Update instruction compiler
- Patch `packages/compiler/src/instructionCompilers/greaterOrEqualUnsigned.ts`.

### Step 2: Add regression tests
- Add float64 coverage for `greaterOrEqualUnsigned` in instruction compiler tests/snapshots.
- Keep existing int32/float32 behavior covered.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:test -- --run tests/instructions`
- `rg -n "greaterOrEqualUnsigned|F64|isFloat64" packages/compiler/src/instructionCompilers`

## Success Criteria

- [ ] `greaterOrEqualUnsigned` handles float64 correctly.
- [ ] Existing int32/float32 behavior remains unchanged.
- [ ] Regression tests cover the float64 path.

## Related Items

- **Related**: `docs/todos/261-update-instruction-test-helpers-for-float64.md`
- **Related**: `docs/todos/252-add-float-promote-demote-instructions.md`
