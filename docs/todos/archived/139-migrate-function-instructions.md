---
title: 'TODO: Migrate Function-Related Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Function-Related Instructions to withValidation

## Problem Description

Five function-related instruction compilers (`function`, `functionEnd`, `call`, `param`, `localGet`) need migration to the `withValidation` helper pattern. These instructions manage function definitions and calls.

## Proposed Solution

Refactor these function instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `function` instruction
- Evaluate validation needs (may need special handling)
- Migrate if appropriate
- Verify tests pass

### Step 2: Migrate `functionEnd` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `call` instruction
- Wrap with appropriate validation (may need operands for parameters)
- Preserve function call logic
- Verify tests pass

### Step 4: Migrate `param` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 5: Migrate `localGet` instruction
- Wrap with appropriate scope validation
- Preserve local variable access logic
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Function semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/function.ts`
- `packages/compiler/src/instructionCompilers/functionEnd.ts`
- `packages/compiler/src/instructionCompilers/call.ts`
- `packages/compiler/src/instructionCompilers/param.ts`
- `packages/compiler/src/instructionCompilers/localGet.ts`

## Risks & Considerations

- **Risk**: Function instructions have complex state management
- **Mitigation**: Test thoroughly, preserve all function semantics
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#138, #140-#143

## Notes

- Function instructions may require special handling due to their role in defining function boundaries
