---
title: 'TODO: Migrate Control Flow Instructions (Batch 1) to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Control Flow Instructions (Batch 1) to withValidation

## Problem Description

Five control flow instruction compilers (`if`, `else`, `ifEnd`, `loop`, `loopEnd`) need migration to the `withValidation` helper pattern. These instructions manage control flow and may have different validation requirements.

## Proposed Solution

Refactor these control flow instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `if` instruction
- Wrap with appropriate validation (likely needs condition on stack)
- Preserve conditional logic
- Verify tests pass

### Step 2: Migrate `else` instruction
- Evaluate validation needs (may only need block structure validation)
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `ifEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 4: Migrate `loop` instruction
- Wrap with appropriate scope validation
- Preserve loop initialization logic
- Verify tests pass

### Step 5: Migrate `loopEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Control flow semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/if.ts`
- `packages/compiler/src/instructionCompilers/else.ts`
- `packages/compiler/src/instructionCompilers/ifEnd.ts`
- `packages/compiler/src/instructionCompilers/loop.ts`
- `packages/compiler/src/instructionCompilers/loopEnd.ts`

## Risks & Considerations

- **Risk**: Control flow instructions have complex state management
- **Mitigation**: Test thoroughly, may need custom validation logic
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#136, #138-#143

## Notes

- Control flow instructions may need special handling due to block stack management
- Some may not benefit from standard operand validation
