---
title: 'TODO: Migrate Control Flow Instructions (Batch 2) to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Control Flow Instructions (Batch 2) to withValidation

## Problem Description

Five more control flow instruction compilers (`block`, `blockEnd`, `branch`, `branchIfTrue`, `branchIfUnchanged`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these control flow instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `block` instruction
- Wrap with appropriate scope validation
- Preserve block initialization logic
- Verify tests pass

### Step 2: Migrate `blockEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `branch` instruction
- Wrap with appropriate validation (may need condition on stack)
- Preserve branch logic
- Verify tests pass

### Step 4: Migrate `branchIfTrue` instruction
- Wrap with validation for condition operand
- Preserve conditional branch logic
- Verify tests pass

### Step 5: Migrate `branchIfUnchanged` instruction
- Wrap with appropriate validation
- Preserve unchanged branch logic
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Branch semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/block.ts`
- `packages/compiler/src/instructionCompilers/blockEnd.ts`
- `packages/compiler/src/instructionCompilers/branch.ts`
- `packages/compiler/src/instructionCompilers/branchIfTrue.ts`
- `packages/compiler/src/instructionCompilers/branchIfUnchanged.ts`

## Risks & Considerations

- **Risk**: Branch instructions have complex control flow logic
- **Mitigation**: Carefully preserve branching behavior
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#137, #139-#143

## Notes

- Branch instructions may need special validation for their condition operands
