---
title: 'TODO: Add compile-time `*` and `/` support for literals, constants, and metadata queries'
priority: Medium
effort: 1-2d
created: 2026-03-27
status: Open
completed: null
---

# TODO: Add compile-time `*` and `/` support for literals, constants, and metadata queries

## Problem Description

8f4e currently supports two separate narrow forms of compile-time arithmetic:

- literal-only `*` and `/` expressions are folded during argument parsing
- constant expressions support `CONST*<literal>` and `CONST/<literal>`

That leaves useful mixed compile-time forms unsupported, even when every input is known at compile time.

Examples that should be possible after the metadata-query syntax migration:
- `const FOO 123*sizeof(name)`
- `const FOO sizeof(name)*2`
- `const FOO SIZE*sizeof(name)`
- `push SIZE*sizeof(buffer)`

Why this is a problem:
- the compiler already knows how to evaluate literals, constants, and metadata queries separately
- users cannot combine those compile-time values in a simple single-operator expression
- the current constant-expression parser is asymmetric because it only allows a constant identifier on the left-hand side

Important timing note:
- this TODO is intended for the post-query-renaming world where metadata uses explicit function forms such as `sizeof(name)`
- it should be designed around `sizeof(...)`, `count(...)`, `max(...)`, and `min(...)`, not around the old `%`, `$`, `^`, and `!` syntax

## Proposed Solution

Add a small compile-time expression parser/evaluator for exactly one `*` or `/` operator where each side can be any compile-time-resolvable value.

Allowed operand categories:
- numeric literals
- constant identifiers
- compile-time metadata queries such as `sizeof(name)`
- later, the same should naturally extend to `count(name)`, `max(name)`, and `min(name)` if those queries are available at compile time in the relevant context

Examples:
- `SIZE*2`
- `2*SIZE`
- `sizeof(name)*2`
- `123*sizeof(name)`
- `SIZE*sizeof(name)`

Explicit non-goals for this TODO:
- no chained expressions such as `2*SIZE*sizeof(name)`
- no mixed-precedence expressions such as `2*SIZE/4`
- no parentheses beyond the query syntax itself
- no `+` or `-` support

## Anti-Patterns

- Do not bolt this onto the existing `CONST*literal` parser with more special cases.
- Do not keep the expression model asymmetric by allowing constants only on the left.
- Do not reintroduce symbolic metadata-query syntax into the new expression logic.
- Do not expand into a general-purpose expression language without an explicit grammar decision.

## Implementation Plan

### Step 1: Replace the current constant mul/div shape parser
- Retire or refactor [parseConstantMulDivExpression.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/syntax/parseConstantMulDivExpression.ts)
- Introduce a compile-time expression parser that accepts exactly one `*` or `/`
- Parse both sides as generic compile-time operands rather than “constant on the left, literal on the right”

### Step 2: Add compile-time operand resolution
- Resolve operand forms through a shared helper that can evaluate:
  - literals
  - constant identifiers
  - metadata queries such as `sizeof(name)`
- Keep the evaluation bounded to compile-time-safe forms only

### Step 3: Use the evaluator in compiler paths that already accept compile-time values
- Update constant evaluation in [resolveConstantValue.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/resolveConstantValue.ts)
- Ensure `const`, `push`, `init`, declarations, and other compile-time consumers can benefit where appropriate
- Preserve existing division-by-zero handling

### Step 4: Add tests for mixed compile-time forms
- Add parser/evaluator tests for:
  - `SIZE*2`
  - `2*SIZE`
  - `sizeof(name)*2`
  - `123*sizeof(name)`
  - `SIZE*sizeof(name)`
- Add rejection tests for:
  - `2*SIZE*sizeof(name)`
  - `2*SIZE/4`
  - unresolved identifiers or unsupported query forms

## Validation Checkpoints

- `sed -n '1,240p' packages/compiler/src/syntax/parseConstantMulDivExpression.ts`
- `sed -n '1,260p' packages/compiler/src/utils/resolveConstantValue.ts`
- `rg -n "sizeof\\(|count\\(|max\\(|min\\(|parseConstantMulDivExpression|resolveConstantValue" packages/compiler/src packages/compiler/tests`
- `npx nx run compiler:test`

## Success Criteria

- [ ] Compile-time `*` and `/` expressions accept literals, constants, and metadata queries on either side.
- [ ] Forms like `123*sizeof(name)` and `SIZE*sizeof(name)` resolve successfully when all inputs are compile-time-known.
- [ ] Existing `SIZE*2` behavior continues to work.
- [ ] Chained and mixed-precedence forms remain rejected.
- [ ] Division by zero still produces the correct compile-time error behavior.

## Affected Components

- `packages/compiler/src/syntax/parseConstantMulDivExpression.ts` - likely replaced or generalized
- `packages/compiler/src/utils/resolveConstantValue.ts` - compile-time expression evaluation
- `packages/compiler/src/syntax/` - compile-time operand parsing helpers
- `packages/compiler/tests/` - parser, constant, and integration coverage

## Risks & Considerations

- **Context sensitivity**: metadata queries are not always valid in every compile-time context, so resolver boundaries must stay explicit.
- **Grammar creep**: once both sides can be arbitrary compile-time operands, it becomes tempting to support chaining and precedence; this TODO should resist that.
- **Ordering dependency**: this work fits best after the explicit query syntax (`sizeof`, `count`, `max`, `min`) is implemented.

## Related Items

- **Related**: [325-add-literal-only-mul-div-folding-at-argument-parse-time.md](/Users/andorpolgar/git/8f4e/docs/todos/325-add-literal-only-mul-div-folding-at-argument-parse-time.md)
- **Related**: [327-replace-symbolic-metadata-prefixes-with-function-style-queries.md](/Users/andorpolgar/git/8f4e/docs/todos/327-replace-symbolic-metadata-prefixes-with-function-style-queries.md)

## Notes

- This TODO is about compile-time evaluation only, not runtime expressions.
- The intended shape is a small, explicit compile-time expression model, not a general expression language.
