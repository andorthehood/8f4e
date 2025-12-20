---
title: 'TODO: Migrate Local Variable Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Open
completed: null
---

# TODO: Migrate Local Variable Instructions to withValidation

## Problem Description

Five instruction compilers related to local variables and memory (`localSet`, `local`, `use`, `wasm`, `store`) need migration to the `withValidation` helper pattern.

## Proposed Solution

Refactor these instruction compilers to use the `withValidation` helper where applicable.

## Implementation Plan

### Step 1: Migrate `localSet` instruction
- Wrap with validation for value on stack
- Preserve local variable assignment logic
- Verify tests pass

### Step 2: Migrate `local` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 3: Migrate `use` instruction
- Evaluate validation needs
- Migrate if appropriate
- Verify tests pass

### Step 4: Migrate `wasm` instruction
- Evaluate validation needs (may be special case)
- Migrate if appropriate
- Verify tests pass

### Step 5: Migrate `store` instruction
- Wrap with validation for address and value on stack
- Preserve memory store logic
- Verify tests pass

## Success Criteria

- [ ] All applicable instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Local variable and memory semantics unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/localSet.ts`
- `packages/compiler/src/instructionCompilers/local.ts`
- `packages/compiler/src/instructionCompilers/use.ts`
- `packages/compiler/src/instructionCompilers/wasm.ts`
- `packages/compiler/src/instructionCompilers/store.ts`

## Risks & Considerations

- **Risk**: Memory operations need careful validation
- **Mitigation**: Preserve all safety checks
- **Breaking Changes**: None expected

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: TODO #131-#139, #141-#143

## Notes

- The `wasm` instruction may be a special case that doesn't benefit from withValidation
- Memory store operations need both address and value validation
