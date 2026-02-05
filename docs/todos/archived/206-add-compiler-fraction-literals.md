---
title: 'TODO: Add Fraction Literals to Compiler'
priority: Medium
effort: 2-4h
created: 2026-01-27
status: Completed
completed: 2026-01-27
---

# TODO: Add Fraction Literals to Compiler

## Problem Description

The compiler does not accept fraction literals like `1/16` in instruction arguments, constants, locals, or memory defaults. Authors currently have to precompute and write decimal values, which is error-prone and harder to read for common ratios.

## Proposed Solution

Add fraction-literal parsing to the syntax argument parser so any numeric-literal position can use `int/int` without whitespace. The literal should evaluate to a number, set `isInteger` based on exact integer results (e.g., `8/2`), and throw a syntax error on division by zero. Keep hex/binary fractions out of scope for now.

## Implementation Plan

### Step 1: Extend argument parsing
- Detect `-?\d+/-?\d+` before generic numeric parsing in `parseArgument`.
- Compute `numerator / denominator` and set `isInteger` via `Number.isInteger`.
- Reject denominator `0` with a syntax error code dedicated to fraction division by zero.

### Step 2: Cover semantics in tests
- Add `parseArgument` tests for `1/16`, `8/2`, `-1/2`, and `8/0` failure.
- Ensure existing tests remain green for decimal/hex/binary literals.

### Step 3: Verify propagation
- Confirm that literals flow through `push`, `const`, `local`, and memory defaults.
- Confirm `int` defaults truncate toward zero via existing `i32.const` encoding.

## Success Criteria

- [ ] `push 1/16` parses and pushes a float literal (`0.0625`).
- [ ] `int foo 1/16` defaults to `0` (truncation toward zero).
- [ ] `float bar 1/16` defaults to `0.0625`.
- [ ] `int foo 8/2` defaults to `4`.
- [ ] `int foo 8/0` throws a syntax-level division-by-zero error.

## Affected Components

- `packages/compiler/src/syntax/parseArgument.ts`
- `packages/compiler/src/syntax/syntaxError.ts`
- `packages/compiler/src/utils/memoryInstructionParser.ts` (validation path relies on literal parsing)

## Risks & Considerations

- **Division-by-zero errors**: define a syntax error code so tooling can distinguish from runtime division checks.
- **Float precision**: `1/16` should map to a stable float32 value when stored.
- **Scope**: avoid adding whitespace or hex/binary fraction support for now.

## Notes

- Fractions are accepted anywhere numeric literals are accepted (`push`, `const`, `local`, memory defaults).
- Whitespace around `/` is not allowed by design.
