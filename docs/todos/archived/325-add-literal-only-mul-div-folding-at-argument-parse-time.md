---
title: 'TODO: Add literal-only `*` and `/` folding at argument parse time'
priority: Medium
effort: 4-8h
created: 2026-03-26
status: Completed
completed: '2026-03-30'
---

# TODO: Add literal-only `*` and `/` folding at argument parse time

## Problem Description

8f4e currently supports a narrow class of literal arithmetic in syntax parsing and a separate narrow class of constant arithmetic during semantic resolution.

Current state:
- `packages/tokenizer/src/syntax/parseArgument.ts` already folds fraction-style literals like `1/2` into `ArgumentType.LITERAL`
- plain literal multiplication such as `16*2` or `3.5*4` is not parsed as a literal and instead falls through as an identifier-shaped token
- constant-based expressions like `SIZE*2` and `SIZE/2` are handled later by `packages/compiler/src/utils/resolveConstantValue.ts`

Why this is a problem:
- users cannot write simple literal-only arithmetic consistently across declarations, `const`, `push`, `init`, and other instructions
- `1/2` already behaves like a richer literal, but `16*2` does not, which is inconsistent
- the compiler already has many downstream paths that accept `ArgumentType.LITERAL`, so failing to fold simple numeric arithmetic early creates avoidable special cases

Important scope boundary:
- this TODO is only about literal-only arithmetic such as `16*2`, `1/2`, and `3.5*4`
- it is not about semantic expressions involving identifiers or constants such as `SIZE*2`

## Proposed Solution

Treat literal-only `*` and `/` expressions as syntax-level numeric literals and fold them during argument parsing.

High-level approach:
- extend `packages/tokenizer/src/syntax/parseArgument.ts` to recognize a single binary arithmetic expression where both operands are numeric literals
- compute the value immediately and return a normal `ArgumentType.LITERAL`
- preserve the existing semantic resolution path for identifier-based constant expressions

Supported forms in this TODO:
- `<numeric-literal>*<numeric-literal>`
- `<numeric-literal>/<numeric-literal>`

Examples:
- `16*2` -> literal `32`
- `1/2` -> literal `0.5`
- `3.5*4` -> literal `14` with float-typed metadata (`isInteger: false`)
- `0x10/2` -> literal `8` if hex literals are accepted in the expression parser

Explicit non-goals for this TODO:
- no identifier-based expressions such as `SIZE*2`
- no chained expressions such as `2*3*4`
- no mixed-precedence expressions such as `2*3/4`
- no parenthesized expressions
- no plus/minus operator support beyond what numeric literals already carry as unary sign

## Anti-Patterns

- Do not move constant-name expression resolution out of `packages/compiler/src/utils/resolveConstantValue.ts`.
- Do not make AST parsing depend on namespace or constant tables.
- Do not stack more ad hoc regex cases on top of the current fraction parser if a single-operator literal-expression parser can replace it cleanly.
- Do not introduce precedence rules implicitly by accepting multiple operators without an explicit expression grammar.

## Implementation Plan

### Step 1: Add a syntax helper for literal-only mul/div expressions
- Create a parser/helper under `packages/compiler/src/syntax/` that recognizes exactly one `*` or `/` operator
- Parse both sides as numeric-literal tokens only
- Reuse existing numeric literal parsing rules where practical so decimal, fraction-compatible, hex, binary, and `f64` forms stay consistent

### Step 2: Fold expressions in `parseArgument`
- Call the new helper before the identifier fallback
- Return `ArgumentType.LITERAL` with the computed value
- Preserve `isInteger` only when the computed result is an integer and no operand forces float64
- Preserve `isFloat64` when either operand is an `f64` literal
- Keep float-typed expressions float-typed even when the numeric result is mathematically an integer
- Throw the existing syntax error for division by zero

### Step 3: Keep semantic constant-expression handling unchanged
- Leave `SIZE*2` and `SIZE/2` in `packages/compiler/src/utils/resolveConstantValue.ts`
- Ensure the new syntax helper does not accidentally consume identifier-based forms that should remain semantic

### Step 4: Add tests across syntax and compiler usage sites
- Unit-test the new parser/helper directly
- Add `parseArgument` tests for:
  - `16*2`
  - `1/2`
  - `3.5*4`
  - `8/2`
  - `0x10/2` if supported
  - `3f64*2`
  - division by zero
  - rejection of chained expressions like `2*3*4`
  - rejection of mixed operator expressions like `2*3/4`
- Add integration tests showing these literal expressions work in:
  - `const`
  - `push`
  - `init`
  - buffer sizes or other declaration arguments that already accept literals

## Validation Checkpoints

- `sed -n '1,260p' packages/compiler/src/syntax/parseArgument.ts`
- `rg -n "literal-only|mul/div|Division by zero|parseArgument" packages/compiler/src packages/compiler/tests`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] Literal-only `*` expressions such as `16*2` parse directly to `ArgumentType.LITERAL`.
- [ ] Literal-only `/` expressions such as `1/2` and `8/2` parse directly to `ArgumentType.LITERAL`.
- [ ] Existing constant-name expressions such as `SIZE*2` continue to resolve in the semantic layer.
- [ ] Chained or mixed-operator expressions are rejected rather than accepted with implicit precedence.
- [ ] Division by zero in literal-only expressions produces the existing syntax error behavior.
- [ ] Existing compiler paths automatically gain support anywhere parsed literals are already accepted.

## Affected Components

- `packages/compiler/src/syntax/parseArgument.ts` - main parse-time folding entry point
- `packages/compiler/src/syntax/` - new helper for single-operator literal-only arithmetic
- `packages/compiler/tests/` - parser and integration coverage
- `packages/compiler/src/utils/resolveConstantValue.ts` - should remain unchanged except for any guard adjustments needed to preserve separation of concerns

## Risks & Considerations

- **Parser overlap**: new literal-only expression parsing must not break existing `f64`, hex, binary, string-literal, or identifier parsing.
- **Type propagation**: `isInteger` and `isFloat64` need to be derived carefully from operands and result.
- **Scope creep**: accepting multiple operators now would force precedence/associativity decisions that this TODO explicitly avoids.
- **Instruction validation**: some instructions may still reject the resulting literal later, which is correct and should remain instruction-specific.

## Related Items

- **Related**: `docs/todos/archived/281-add-plus-minus-support-to-constant-expressions.md`

## Notes

- This TODO intentionally treats literal-only arithmetic as "richer numeric literal syntax", not as a general expression language.
- The goal is for the AST to contain already-folded literal values only when no semantic context is required.
