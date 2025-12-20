---
title: 'TODO: Migrate Stack Manipulation Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Stack Manipulation Instructions to withValidation

## Problem Description

Five stack manipulation instruction compilers (`drop`, `push`, `clearStack`, `skip`, `const`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these instruction compilers to use the `withValidation` helper where applicable. Note that some instructions like `push` and `const` may not need validation if they don't consume operands from the stack.

## Implementation Plan

### Step 1: Migrate `drop` instruction
- Wrap with `withValidation` using `minOperands: 1`, `operandTypes: 'any'`
- Preserve drop logic
- Verify tests pass

### Step 2: Evaluate `push` instruction
- Determine if validation is needed (likely only scope validation)
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `clearStack` instruction
- Wrap with appropriate scope validation
- Preserve clear stack logic
- Verify tests pass

### Step 4: Migrate `skip` instruction
- Wrap with appropriate validation
- Preserve skip logic
- Verify tests pass

### Step 5: Evaluate `const` instruction
- Determine if validation is needed
- Migrate if appropriate
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/drop.ts`
- `packages/compiler/src/instructionCompilers/push.ts`
- `packages/compiler/src/instructionCompilers/clearStack.ts`
- `packages/compiler/src/instructionCompilers/skip.ts`
- `packages/compiler/src/instructionCompilers/const.ts`

## Risks & Considerations

- **Risk**: Some instructions may not benefit from withValidation if they don't consume operands
- **Mitigation**: Evaluate each instruction individually
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#135, #137-#143

## Notes

- Stack manipulation instructions vary widely in their validation needs
- Some may only need scope validation, not operand validation
