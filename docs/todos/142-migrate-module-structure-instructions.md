---
title: 'TODO: Migrate Module Structure Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Module Structure Instructions to withValidation

## Problem Description

Five instruction compilers related to module structure (`fallingEdge`, `risingEdge`, `module`, `moduleEnd`, `init`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these module structure instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `fallingEdge` instruction
- Wrap with appropriate validation
- Preserve edge detection logic
- Verify tests pass

### Step 2: Migrate `risingEdge` instruction
- Wrap with appropriate validation
- Preserve edge detection logic
- Verify tests pass

### Step 3: Migrate `module` instruction
- Evaluate validation needs (likely no operand validation needed)
- Migrate if appropriate
- Verify tests pass

### Step 4: Migrate `moduleEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 5: Migrate `init` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Module structure semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/fallingEdge.ts`
- `packages/compiler/src/instructionCompilers/risingEdge.ts`
- `packages/compiler/src/instructionCompilers/module.ts`
- `packages/compiler/src/instructionCompilers/moduleEnd.ts`
- `packages/compiler/src/instructionCompilers/init.ts`

## Risks & Considerations

- **Risk**: Module structure instructions define boundaries and may not fit standard validation
- **Mitigation**: Evaluate each instruction individually
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#141, #143

## Notes

- Edge detection instructions (fallingEdge, risingEdge) likely need operand validation
- Module boundary instructions (module, moduleEnd) may only need scope validation
