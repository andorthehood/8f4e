---
title: 'TODO: Migrate Comparison Instructions (Batch 2) to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Comparison Instructions (Batch 2) to withValidation

## Problem Description

Five more instruction compilers with validation patterns (`greaterOrEqual`, `greaterOrEqualUnsigned`, `shiftRightUnsigned`, `ensureNonZero`, `castToInt`) need migration to `withValidation`.

## Proposed Solution

Refactor these instruction compilers to use the `withValidation` helper.

## Implementation Plan

### Step 1: Migrate `greaterOrEqual` instruction
- Wrap with `withValidation` using `scope: 'moduleOrFunction'`, `minOperands: 2`, `operandTypes: 'matching'`
- Preserve comparison logic
- Verify tests pass

### Step 2: Migrate `greaterOrEqualUnsigned` instruction
- Wrap with appropriate validation (likely integers only)
- Preserve unsigned comparison logic
- Verify tests pass

### Step 3: Migrate `shiftRightUnsigned` instruction
- Wrap with `minOperands: 2`, `operandTypes: 'int'`
- Preserve unsigned shift logic
- Verify tests pass

### Step 4: Migrate `ensureNonZero` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'any'`
- Preserve non-zero check logic
- Verify tests pass

### Step 5: Migrate `castToInt` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'any'`
- Preserve type conversion logic
- Verify tests pass

## Success Criteria

- [ ] All 5 instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/greaterOrEqual.ts`
- `packages/compiler/src/instructionCompilers/greaterOrEqualUnsigned.ts`
- `packages/compiler/src/instructionCompilers/shiftRightUnsigned.ts`
- `packages/compiler/src/instructionCompilers/ensureNonZero.ts`
- `packages/compiler/src/instructionCompilers/castToInt.ts`

## Risks & Considerations

- **Risk**: Unsigned operations have special handling
- **Mitigation**: Review existing logic carefully before wrapping
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#133, #135-#143

## Notes

- Pay special attention to unsigned operations which may have different validation requirements
