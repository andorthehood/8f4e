---
title: 'TODO: Migrate Memory-Related Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Memory-Related Instructions to withValidation

## Problem Description

Five instruction compilers related to memory operations (`loadFloat`, `memory`, `buffer`, `cycle`, `hasChanged`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these memory instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `loadFloat` instruction
- Wrap with validation similar to `load` (module scope, integer address)
- Preserve float loading logic
- Verify tests pass

### Step 2: Migrate `memory` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `buffer` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 4: Migrate `cycle` instruction
- Wrap with appropriate validation
- Preserve cycle detection logic
- Verify tests pass

### Step 5: Migrate `hasChanged` instruction
- Wrap with appropriate validation
- Preserve change detection logic
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Memory operation semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/loadFloat.ts`
- `packages/compiler/src/instructionCompilers/memory.ts`
- `packages/compiler/src/instructionCompilers/buffer.ts`
- `packages/compiler/src/instructionCompilers/cycle.ts`
- `packages/compiler/src/instructionCompilers/hasChanged.ts`

## Risks & Considerations

- **Risk**: Memory operations may have special requirements
- **Mitigation**: Follow the pattern from `load` instruction
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#140, #142-#143

## Notes

- `loadFloat` should follow similar pattern to `load` instruction
- Memory declaration instructions may not need operand validation
