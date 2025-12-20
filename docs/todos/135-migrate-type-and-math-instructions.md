---
title: 'TODO: Migrate Type Casting and Math Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Type Casting and Math Instructions to withValidation

## Problem Description

Five instruction compilers for type casting and math operations (`castToFloat`, `round`, `sqrt`, `dup`, `swap`) need migration to the `withValidation` helper pattern.

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

### Step 4: Migrate `dup` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'any'`
- Preserve stack duplication logic
- Verify tests pass

### Step 5: Migrate `swap` instruction
- Wrap with `minOperands: 2`, `operandTypes: 'any'`
- Preserve stack swap logic
- Verify tests pass

## Success Criteria

- [ ] All 5 instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/castToFloat.ts`
- `packages/compiler/src/instructionCompilers/round.ts`
- `packages/compiler/src/instructionCompilers/sqrt.ts`
- `packages/compiler/src/instructionCompilers/dup.ts`
- `packages/compiler/src/instructionCompilers/swap.ts`

## Risks & Considerations

- **Risk**: Stack manipulation operations (dup, swap) need careful handling
- **Mitigation**: Verify stack state is correct after migration
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#134, #136-#143

## Notes

- Math operations like sqrt and round typically work on floats
- Stack operations like dup and swap work on any type
