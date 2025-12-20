---
title: 'TODO: Migrate Comparison Instructions (Batch 1) to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Comparison Instructions (Batch 1) to withValidation

## Problem Description

Five comparison instruction compilers (`equal`, `equalToZero`, `lessThan`, `lessOrEqual`, `greaterThan`) still use manual validation logic with repeated scope and operand checks.

## Proposed Solution

Refactor these comparison instruction compilers to use the `withValidation` helper.

## Implementation Plan

### Step 1: Migrate `equal` instruction
- Wrap with `withValidation` using `scope: 'moduleOrFunction'`, `minOperands: 2`, `operandTypes: 'matching'`
- Preserve comparison logic
- Verify tests pass

### Step 2: Migrate `equalToZero` instruction
- Wrap with `minOperands: 1`, `operandTypes: 'any'`
- Preserve zero comparison logic
- Verify tests pass

### Step 3: Migrate `lessThan` instruction
- Use same validation spec as `equal`
- Preserve less-than comparison logic
- Verify tests pass

### Step 4: Migrate `lessOrEqual` instruction
- Use same validation spec as `equal`
- Preserve less-or-equal comparison logic
- Verify tests pass

### Step 5: Migrate `greaterThan` instruction
- Use same validation spec as `equal`
- Preserve greater-than comparison logic
- Verify tests pass

## Success Criteria

- [ ] All 5 instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Comparison return values (boolean results) unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/equal.ts`
- `packages/compiler/src/instructionCompilers/equalToZero.ts`
- `packages/compiler/src/instructionCompilers/lessThan.ts`
- `packages/compiler/src/instructionCompilers/lessOrEqual.ts`
- `packages/compiler/src/instructionCompilers/greaterThan.ts`

## Risks & Considerations

- **Risk**: Comparison operations must handle both int and float operands
- **Mitigation**: Use `operandTypes: 'matching'` to ensure both operands have same type
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#132, #134-#143

## Notes

- Most comparison operations work with matching types (both int or both float)
- Follow the pattern from migrated instructions
