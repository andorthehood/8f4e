---
title: 'TODO: Migrate Bitwise Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Bitwise Instructions to withValidation

## Problem Description

Five bitwise instruction compilers (`and`, `or`, `xor`, `shiftLeft`, `shiftRight`) still use manual validation logic. They repeat scope checks, operand count validation, and integer type checking.

## Proposed Solution

Refactor these bitwise instruction compilers to use the `withValidation` helper from `packages/compiler/src/withValidation.ts`.

## Implementation Plan

### Step 1: Migrate `and` instruction
- Wrap with `withValidation` using `scope: 'moduleOrFunction'`, `minOperands: 2`, `operandTypes: 'int'`
- Preserve bitwise AND logic
- Verify tests pass

### Step 2: Migrate `or` instruction
- Use same validation spec as `and`
- Preserve bitwise OR logic
- Verify tests pass

### Step 3: Migrate `xor` instruction
- Use same validation spec
- Preserve bitwise XOR logic
- Verify tests pass

### Step 4: Migrate `shiftLeft` instruction
- Use same validation spec
- Preserve left shift logic
- Verify tests pass

### Step 5: Migrate `shiftRight` instruction
- Use same validation spec
- Preserve right shift logic
- Verify tests pass

## Success Criteria

- [ ] All 5 instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Error codes remain unchanged (ONLY_INTEGERS for type errors)
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/and.ts`
- `packages/compiler/src/instructionCompilers/or.ts`
- `packages/compiler/src/instructionCompilers/xor.ts`
- `packages/compiler/src/instructionCompilers/shiftLeft.ts`
- `packages/compiler/src/instructionCompilers/shiftRight.ts`

## Risks & Considerations

- **Risk**: Integer-only operations must maintain ONLY_INTEGERS error code
- **Mitigation**: Use `onInvalidTypes: ErrorCode.ONLY_INTEGERS` in validation spec
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131, #133-#143

## Notes

- All bitwise operations require integer operands only
- Follow the pattern established in migrated instructions
