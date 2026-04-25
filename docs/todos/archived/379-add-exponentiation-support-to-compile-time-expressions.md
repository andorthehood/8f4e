---
title: 'TODO: Add exponentiation support to compile-time expressions'
priority: Medium
effort: 4-8h
created: 2026-04-17
status: Completed
completed: 2026-04-17
---

# TODO: Add exponentiation support to compile-time expressions

## Problem Description

Compile-time arithmetic currently supports single-operator multiplication and division expressions, with literal-only folding handled during argument parsing and const/metadata-backed expressions handled during semantic normalization. This covers forms like `2*8`, `SIZE*2`, and `SIZE/2`, but it does not cover power-of-two sizing expressions like `2^16`.

That forces users to write expanded numeric literals for common binary sizes, buffer lengths, masks, and table dimensions. The result is less readable source and more opportunities for transcription mistakes when the intended value is naturally expressed as a power.

## Proposed Solution

Add exponentiation support for compile-time expressions using `^` as the source-level operator in the same places where single-operator compile-time expressions already work.

Supported forms should include:
- `2^16`
- `SIZE^2`
- `2^WIDTH`
- `sizeof(sample)^2`

Keep this compile-time only. The `^` operator should not imply a new runtime stack instruction, and it should not change existing instruction names such as `xor` or `pow2`.

## Anti-Patterns

- Do not treat `^` as bitwise XOR in compile-time expressions.
- Do not add general expression precedence or chained expression support as part of this TODO.
- Do not allow runtime-only values, locals, or memory contents to participate in exponentiation.
- Do not silently accept fractional or negative exponents unless the intended numeric and integer-width semantics are explicitly decided and tested.

## Implementation Plan

### Step 1: Extend tokenizer expression parsing
- Extend the literal-only expression parser currently used by `parseArgument(...)` to recognize a single `^` operator.
- Extend the const/metadata compile-time expression parser to recognize a single `^` operator.
- Preserve the exactly-one-operator rule so chained forms like `2^3^4` remain invalid.
- Ensure signed numeric literals remain unambiguous, especially around forms like `2^-1` if that syntax is intentionally accepted or rejected.

### Step 2: Extend semantic expression evaluation
- Update `tryResolveCompileTimeArgument(...)` expression evaluation to support exponentiation.
- Decide and encode integer semantics:
  - integer base and integer exponent with an integer result should remain integer,
  - float64 operands should preserve `isFloat64`,
  - division-by-zero style invalid cases should keep returning unresolved or throwing through the existing normalization path.
- Add explicit handling for invalid exponent cases if fractional or negative exponents are out of scope.

### Step 3: Add regression coverage
- Add tokenizer tests for literal-only forms such as `2^16`, `0x10^2`, and rejected chained forms.
- Add resolver tests for const-backed forms such as `SIZE^2` and `2^SIZE`.
- Add instruction-level compiler tests for `const`, declaration counts/defaults, `push`, and `init`.
- Update compiler docs to show exponentiation examples where compile-time expressions are documented.

## Validation Checkpoints

- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/compiler:test -- packages/compiler/tests/instructions/constantExpressions.test.ts`
- `npx nx run @8f4e/compiler:typecheck`
- `rg -n "\\^|exponent|compile-time expression" packages/compiler docs`

## Success Criteria

- [ ] `const WIDTH 2^16` folds to the literal value `65536`.
- [ ] `const TOTAL SIZE^2` resolves when `SIZE` is a known compile-time constant.
- [ ] Exponentiation works anywhere current single-operator compile-time expressions are normalized, including declarations, `push`, and `init`.
- [ ] Existing `*` and `/` behavior remains unchanged.
- [ ] Chained expressions are still rejected or unresolved according to the current expression-boundary rules.
- [ ] Tests document accepted and rejected exponentiation forms.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts` - argument parsing entrypoint.
- `packages/compiler/packages/tokenizer/src/syntax/parseLiteralMulDivExpression.ts` - literal-only arithmetic parser, or a renamed/generalized equivalent.
- `packages/compiler/packages/tokenizer/src/syntax/parseConstantMulDivExpression.ts` - const/metadata expression parser, or a renamed/generalized equivalent.
- `packages/compiler/src/semantic/resolveCompileTimeArgument.ts` - semantic compile-time expression evaluation.
- `packages/compiler/packages/tokenizer/src/syntax/parseArgument.test.ts` - tokenizer coverage.
- `packages/compiler/src/semantic/resolveCompileTimeArgument.test.ts` - resolver coverage.
- `packages/compiler/tests/instructions/constantExpressions.test.ts` - end-to-end instruction behavior.
- `packages/compiler/docs/` - compile-time expression examples and operator list.

## Risks & Considerations

- **Operator meaning**: Many languages use `^` for XOR rather than exponentiation. 8f4e should document this as compile-time exponentiation only.
- **Existing prefix syntax**: `^name` is already used as an element maximum query. Infix `left^right` parsing must not break prefix metadata references.
- **Numeric bounds**: Large powers can exceed JavaScript safe integer or WebAssembly immediate expectations. Decide whether to reject unsafe integer results or rely on existing downstream range checks.
- **Expression growth**: This should stay a small single-operator extension, not a general expression parser.
- **Breaking Changes**: None expected for valid existing programs.

## Related Items

- **Related**: `docs/todos/archived/281-add-plus-minus-support-to-constant-expressions.md`
- **Related**: `docs/todos/archived/325-add-literal-only-mul-div-folding-at-argument-parse-time.md`
- **Related**: `docs/todos/055-strength-reduction-compiler-optimization.md`

## Notes

- This TODO is intentionally separate from plus/minus support so exponentiation semantics, operator meaning, and numeric range behavior can be decided independently.
