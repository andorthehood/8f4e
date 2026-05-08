---
title: 'TODO: Migrate Type Casting and Math Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Type Casting and Math Instructions to withValidation

## Problem Description

The type casting and math instruction compilers (`castToFloat`, `round`, `sqrt`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these instruction compilers to use the `withValidation` helper.

## Implementation Plan

### Step 1: Migrate `castToFloat` instruction
- Wrap with `withValidation` using `minOperands: 1`, `operandTypes: 'any'`
- Preserve float casting logic
- Verify tests pass

### Step 2: Migrate `round` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'float'`
- Preserve rounding logic
- Verify tests pass

### Step 3: Migrate `sqrt` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'float'`
- Preserve square root logic
- Verify tests pass

## Success Criteria

- [ ] All instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/castToFloat.ts`
- `packages/compiler/src/instructionCompilers/round.ts`
- `packages/compiler/src/instructionCompilers/sqrt.ts`

## Risks & Considerations

- **Risk**: Numeric operations need careful handling across supported operand widths
- **Mitigation**: Verify stack state and numeric output after migration
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#134, #136-#143

## Notes

- Math operations like sqrt and round typically work on floats
