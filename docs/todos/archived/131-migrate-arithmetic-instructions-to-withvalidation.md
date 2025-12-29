---
title: 'TODO: Migrate Arithmetic Instructions to withValidation'
priority: Medium
effort: 2-3h
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Migrate Arithmetic Instructions to withValidation

## Problem Description

Five arithmetic instruction compilers (`sub`, `mul`, `div`, `remainder`, `pow2`) still use manual validation logic. They repeat scope checks, operand count validation, and type checking, making them harder to maintain and inconsistent with the new `withValidation` helper pattern.

## Proposed Solution

Refactor these arithmetic instruction compilers to use the `withValidation` helper from `packages/compiler/src/withValidation.ts`. This will reduce code duplication and make the validation logic explicit and consistent.

## Implementation Plan

### Step 1: Migrate `sub` instruction
- Wrap with `withValidation` using `scope: 'moduleOrFunction'`, `minOperands: 2`, `operandTypes: 'matching'`
- Keep the subtraction logic intact
- Verify tests pass

### Step 2: Migrate `mul` instruction
- Similar to `sub` with same validation spec
- Preserve multiplication logic
- Verify tests pass

### Step 3: Migrate `div` instruction
- Use same validation spec as `sub` and `mul`
- Keep division-by-zero check in the compiler function body
- Verify tests pass

### Step 4: Migrate `remainder` instruction
- Use same validation spec
- Keep remainder-specific logic
- Verify tests pass

### Step 5: Migrate `pow2` instruction
- Wrap with appropriate validation (likely `minOperands: 1`, `operandTypes: 'int'`)
- Preserve power-of-2 logic
- Verify tests pass

## Success Criteria

- [ ] All 5 instructions use `withValidation` wrapper
- [ ] All existing tests pass without modification
- [ ] Error codes and messages remain unchanged
- [ ] Type checking passes
- [ ] Linting passes

## Affected Components

- `packages/compiler/src/instructionCompilers/sub.ts`
- `packages/compiler/src/instructionCompilers/mul.ts`
- `packages/compiler/src/instructionCompilers/div.ts`
- `packages/compiler/src/instructionCompilers/remainder.ts`
- `packages/compiler/src/instructionCompilers/pow2.ts`

## Risks & Considerations

- **Risk**: Subtle behavior changes if validation order differs
- **Mitigation**: Run all existing tests to verify behavior is preserved
- **Breaking Changes**: None expected if validation specs match existing logic

## Related Items

- **Depends on**: TODO #130 (Instruction Compiler Validation Helper) - Completed
- **Related**: Other instruction migration TODOs (#132-#143)

## Notes

- Follow the pattern established in `add.ts`, `abs.ts`, and `load.ts`
- Add explanatory comments for non-null assertions (e.g., `// Non-null assertion is safe: withValidation ensures N operands exist`)
- Keep instruction-specific logic (like division-by-zero checks) inside the wrapped compiler function
