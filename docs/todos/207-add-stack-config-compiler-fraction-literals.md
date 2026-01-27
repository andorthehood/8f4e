---
title: 'TODO: Add Fraction Literals to Stack Config Compiler'
priority: Medium
effort: 2-4h
created: 2026-01-27
status: Completed
completed: 2026-01-27
---

# TODO: Add Fraction Literals to Stack Config Compiler

## Problem Description

The stack-config-compiler parses numeric literals via `parseLiteral`, which currently uses `parseFloat` and accepts partial numbers. That means `1/16` becomes `1` today instead of being rejected or parsed as a fraction. This makes ratios hard to express and can silently introduce errors.

## Proposed Solution

Add fraction-literal support to the stack-config-compiler parser so numeric arguments accept `int/int` with no whitespace. Evaluate to a numeric literal, keep behavior consistent with other numeric parsing, and return a parse error on division by zero. Tighten numeric parsing to avoid partial `parseFloat` acceptance (e.g., `1/16` or `123abc` should not be treated as `1` or `123`).

## Implementation Plan

### Step 1: Update literal parsing in `parseLiteral`
- Add fraction detection to `packages/stack-config-compiler/src/parser/parseLiteral.ts` before generic number handling.
- Replace permissive `parseFloat` parsing with a strict numeric regex (e.g., `^-?\d+(\.\d+)?$`) so invalid tokens don’t partially parse.

### Step 2: Add fraction literal handling
- Detect `-?\d+/-?\d+` before generic numeric parsing.
- Compute `numerator / denominator` and return a `number` literal.
- Reject denominator `0` with a parse error message that matches stack-config error style.

### Step 3: Tests and validation
- Add tests in `parseLiteral` and `parseLine` for `push 1/16`, `const MAX 8/2`, and `8/0` failure.
- Add a regression test that `push 1/16` does not parse as `1`.

## Success Criteria

- [x] `push 1/16` parses as `0.0625` (not `1`).
- [x] `const MAX 8/2` parses as `4`.
- [x] `8/0` throws a parse error.
- [x] Invalid numeric tokens (e.g., `123abc`) are rejected.

## Risks & Considerations

- **Float precision**: fractions like `1/3` will be approximated as JS numbers.
- **Breaking change**: stricter numeric parsing may reject tokens that previously partially parsed.
- **Scope**: no whitespace or hex/binary fraction support for now.

## Notes

- Keep behavior consistent with `@8f4e/compiler` fraction literals (no whitespace, division-by-zero error).
