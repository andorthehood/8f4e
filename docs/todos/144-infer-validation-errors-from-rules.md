---
title: 'TODO: Infer Validation Errors from Operand Rules'
priority: Medium
effort: 4-6h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Infer Validation Errors from Operand Rules

## Problem Description

`withValidation` currently requires explicit error code overrides (ex: `onInvalidTypes`) even when the proper error can be derived from operand rules. This causes repeated boilerplate, inconsistent error selection, and keeps legacy error codes like `EXPECTED_INTEGER_OPERAND` alive even though they overlap with `ONLY_INTEGERS`.

## Proposed Solution

Infer error codes directly from validation data:
- `operandTypes: 'int'` -> `ONLY_INTEGERS`
- `operandTypes: 'float'` -> `ONLY_FLOATS`
- `operandTypes: 'matching'` -> `UNMATCHING_OPERANDS`
- `operandTypes: ['int', 'float', ...]` -> `TYPE_MISMATCH`
- `operandTypes: 'any'` -> skip type validation

Remove `onInvalidTypes` from the `withValidation` API and drop `EXPECTED_INTEGER_OPERAND`/`EXPECTED_FLOAT_OPERAND` from the compiler error set.

## Implementation Plan

### Step 1: Update error model
- Remove redundant error codes from `packages/compiler/src/errors.ts`
- Adjust error messages or create a single mapping for the inferred type errors

### Step 2: Update validation helper
- Remove `onInvalidTypes` from `ValidationSpec`
- Infer error codes inside `withValidation` based on `operandTypes`

### Step 3: Migrate compiler usage and tests
- Remove `onInvalidTypes` usage across instruction compilers
- Update any manual `EXPECTED_INTEGER_OPERAND` checks to `ONLY_INTEGERS`
- Update tests to match the inferred error behavior

## Success Criteria

- [ ] `withValidation` does not accept explicit type error overrides
- [ ] All instruction compilers rely on inferred errors for operand types
- [ ] `EXPECTED_INTEGER_OPERAND` and `EXPECTED_FLOAT_OPERAND` are removed from error codes
- [ ] All compiler tests pass with updated error expectations

## Affected Components

- `packages/compiler/src/withValidation.ts` - infer errors from operand rules
- `packages/compiler/src/errors.ts` - remove redundant error codes
- `packages/compiler/src/instructionCompilers/*` - remove explicit error overrides
- `packages/compiler/tests/utils/withValidation.test.ts` - update expected errors

## Risks & Considerations

- **Breaking Changes**: Error codes and messages will change; update any dependent docs/tests
- **Behavior Drift**: Ensure inferred errors match intent for all existing instructions

## Related Items

- **Related**: `docs/todos/130-instruction-compiler-validation-helper.md`

## Notes

- This change intentionally breaks error-code compatibility to simplify the validation API.
