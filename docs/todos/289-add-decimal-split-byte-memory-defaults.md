---
title: 'TODO: Add Decimal Split-Byte Memory Defaults'
priority: Medium
effort: 4-8h
created: 2026-03-09
status: Open
completed: null
---

# TODO: Add Decimal Split-Byte Memory Defaults

## Problem Description

Split-byte memory defaults already exist for hexadecimal byte tokens, but there is no equivalent for decimal byte values. This forces users to convert byte-oriented values into hex even when they naturally think in decimal.

Desired examples:
- `int foo 32 64 0 0`
- `int 32 64 00 00`

This should still produce one numeric default value, not multiple declarations.

The design also needs to preserve existing behavior for single numeric literals:
- `int 32` must remain an anonymous integer allocation with value `32`

## Proposed Solution

Extend split-byte memory defaults to accept decimal byte tokens in addition to hexadecimal ones.

Semantics:
- A single numeric literal keeps its current behavior.
- Two or more byte-sized integer literals in a memory declaration are treated as split-byte notation.
- Bytes are combined left-to-right as most-significant to least-significant bytes.
- For 32-bit `int`, missing trailing bytes are padded on the right with `0`.
- Byte values must be positive integers in the range `0..255`.
- Anonymous and named declarations use the same rules.

Examples for `int`:
- `int foo 32 64` => bytes `[32, 64, 0, 0]` => `0x20400000`
- `int foo 32 64 0 0` => `0x20400000`
- `int 32 64` => anonymous `int` with default `0x20400000`
- `int 32` => existing behavior, anonymous `int` with value `32`
- `int foo 00 01` => valid, bytes `[0, 1, 0, 0]`

Recommended validation rules:
- Accept only integer byte literals in split-byte mode.
- Reject negatives, floats, constants, identifiers, and values greater than `255`.
- Prefer allowing mixed decimal and hex byte tokens in the same split-byte sequence if each token resolves to an integer byte in `0..255`.
- If mixed forms are considered too permissive, explicitly forbid them and test/document that rule.

## Anti-Patterns

- Do not reinterpret single-token declarations like `int 32` as split-byte syntax.
- Do not accept multi-token decimal defaults as separate arguments with unrelated semantics.
- Do not allow negative numbers or float literals in split-byte mode.
- Do not silently clamp values like `256` down to `255`.

## Implementation Plan

### Step 1: Extend split-byte detection
- Update memory declaration parsing so split-byte mode triggers when there are two or more byte-sized integer literals.
- Preserve existing one-token numeric declaration behavior unchanged.
- Keep named and anonymous declarations aligned.

### Step 2: Validate decimal byte tokens
- Accept decimal integer literals with optional leading zeros in split-byte mode.
- Enforce `0..255` range checks and reject malformed numeric forms.
- Decide and document whether mixed decimal/hex sequences are accepted.

### Step 3: Resolve bytes into one integer default
- Reuse the existing split-byte assembly logic for left-to-right byte concatenation and right-side zero padding.
- Add tests for decimal-only, mixed, anonymous, and invalid inputs.
- Update docs with explicit examples covering `int 32`, `int 32 64`, and `int foo 32 64 0 0`.

## Validation Checkpoints

- `rg -n "split-byte|32 64|0..255|decimal byte" packages/compiler docs`
- `npx nx run-many --target=test --projects=compiler`

## Success Criteria

- [ ] `int foo 32 64` compiles as split-byte notation to `0x20400000`.
- [ ] `int foo 32 64 0 0` compiles to the same result.
- [ ] `int 32 64` works as an anonymous split-byte declaration.
- [ ] `int 32` continues to mean anonymous integer with value `32`.
- [ ] Values outside `0..255`, negatives, and floats fail with explicit compiler errors.

## Affected Components

- `packages/compiler/src/syntax/memoryInstructionParser.ts` - Broaden split-byte syntax detection to decimal byte tokens.
- `packages/compiler/src/utils/memoryInstructionParser.ts` - Validate and combine decimal byte sequences into one default value.
- `packages/compiler/tests` - Add named, anonymous, and invalid decimal split-byte coverage.
- `packages/compiler/docs/instructions/declarations-and-locals.md` - Document decimal split-byte examples and the one-token vs multi-token rule.

## Risks & Considerations

- **Ambiguity threshold**: The “1 token = normal literal, 2+ tokens = split-byte” rule must be documented clearly to avoid confusion.
- **Mixed literal forms**: Supporting both `32 0x40` and `0x20 64` is convenient, but broadens the grammar; decide explicitly.
- **Leading zeros**: Decimal `00` should likely be accepted as `0`, but this should be tested so behavior is stable.
- **Backward compatibility**: Existing syntax and error behavior for non-split declarations must remain unchanged.

## Related Items

- **Related**: `docs/todos/288-add-split-hexadecimal-memory-defaults.md`

## Notes

- Initial decision: `int 32` stays unchanged.
- Initial decision: `int 32 64` becomes split-byte notation for anonymous allocation.
- Initial decision: byte order remains left-to-right, matching the existing split-hex behavior.
