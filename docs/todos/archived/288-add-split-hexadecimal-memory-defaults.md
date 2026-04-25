---
title: 'TODO: Add Split Hexadecimal Memory Defaults'
priority: Medium
effort: 4-8h
created: 2026-03-08
status: Completed
completed: 2026-03-08
---

# TODO: Add Split Hexadecimal Memory Defaults

## Problem Description

Memory declarations currently accept a single numeric literal as a default value, including plain hexadecimal forms like `0xA8FF0000`. That works, but it is awkward when the intended value is thought of as bytes.

The desired syntax is a split-byte hexadecimal form for memory declaration defaults:
- `int foo 0xA8 0xFF 0x00 0x00`
- `int 0xA8 0xFF`

This should still represent one numeric default value, not multiple arguments or multiple allocations.

Without dedicated support, users must manually concatenate bytes into a single large hex literal, which is harder to read and edit when values are byte-oriented.

## Proposed Solution

Extend memory declaration parsing so adjacent hexadecimal byte literals can be combined into a single integer default value.

Semantics:
- Supported only in memory declarations, not as a generic multi-literal form for other instructions.
- Bytes are combined left-to-right as most-significant to least-significant bytes.
- For 32-bit `int` declarations, fewer than 4 bytes are padded on the right with `0x00`.
- More bytes than the target type width allows should produce a compiler error.
- Anonymous declarations should follow the same rules as named declarations.

Examples for `int`:
- `int foo 0xA8 0xFF 0x00 0x00` => `0xA8FF0000`
- `int foo 0xA8 0xFF` => `0xA8FF0000`
- `int foo 0xA8` => `0xA8000000`
- `int 0xA8 0xFF` => anonymous `int` with default `0xA8FF0000`

Recommended validation rules:
- Each split chunk must be exactly one byte in hex form: `0x00` to `0xFF`.
- The syntax should be recognized only when all participating tokens are hex-byte literals.
- Existing single-literal forms such as `int foo 0xA8FF0000` and `int 0x8F` must remain unchanged.

## Anti-Patterns

- Do not interpret split hex as little-endian byte order. `0xA8 0xFF` must not become `0x0000FFA8`.
- Do not generalize this to arbitrary instructions like `push 0xA8 0xFF`.
- Do not accept mixed forms like `int foo 0xA8 255` or `int foo 0xA8 CONST`.
- Do not silently truncate overflow bytes beyond the target type width.

## Implementation Plan

### Step 1: Extend memory declaration syntax handling
- Update memory declaration argument parsing to allow additional trailing arguments when they are part of split hex syntax.
- Distinguish between normal declaration forms and split-hex forms without weakening existing validation.
- Keep anonymous and named declaration handling aligned.

### Step 2: Combine split hex bytes into one numeric default
- Add a helper that recognizes a sequence of hex-byte literals and combines them into a single integer.
- Pad missing trailing bytes with `0x00` according to the target memory type width.
- Reject byte counts that exceed the width of the declaration target.

### Step 3: Add tests and docs
- Add parser/compiler tests for named and anonymous `int` declarations using split hex.
- Add negative tests for mixed tokens, malformed byte widths, and overflow byte counts.
- Update declaration docs with examples and explicit byte-order semantics.

## Validation Checkpoints

- `rg -n "split hex|split hexadecimal|0xA8 0xFF" packages/compiler docs`
- `npx nx run-many --target=test --projects=compiler`

## Success Criteria

- [ ] `int foo 0xA8 0xFF 0x00 0x00` compiles to one integer default value `0xA8FF0000`.
- [ ] `int foo 0xA8 0xFF` compiles to `0xA8FF0000` via right-side zero padding.
- [ ] `int 0xA8 0xFF` works for anonymous allocation with the same semantics.
- [ ] Existing single-token decimal, binary, and hexadecimal defaults remain unchanged.
- [ ] Invalid split forms fail with explicit compiler errors.

## Affected Components

- `packages/compiler/src/syntax/memoryInstructionParser.ts` - Extend accepted declaration argument shapes.
- `packages/compiler/src/utils/memoryInstructionParser.ts` - Resolve split hex sequences into one numeric default.
- `packages/compiler/src/instructionCompilers/int.ts` - Use resolved combined default for integer declarations.
- `packages/compiler/tests` - Add declaration coverage for named, anonymous, and invalid split-hex cases.
- `packages/compiler/docs/instructions/declarations-and-locals.md` - Document syntax and byte-order rules.

## Risks & Considerations

- **Ambiguity**: The byte-order rule must be explicit in docs and tests so users do not assume little-endian interpretation.
- **Scope creep**: Restricting the feature to memory declarations avoids creating a broader multi-literal syntax surface accidentally.
- **Type-width semantics**: If later expanded to `int8`, `int16`, pointers, or arrays, width-specific behavior must stay consistent and explicit.
- **Backward compatibility**: Existing declaration parsing should not become more permissive for unrelated malformed inputs.

## Related Items

- **Related**: `docs/todos/206-add-fraction-literals-to-compiler.md`
- **Related**: `docs/todos/archived/281-add-plus-minus-support-to-constant-expressions.md`

## Notes

- Initial decision: interpret bytes left-to-right in source order, as visual hexadecimal concatenation.
- Initial decision: for 32-bit `int`, missing trailing bytes are padded with `0x00` on the right.
- Initial decision: anonymous declarations such as `int 0xA8 0xFF` should be supported the same way as named declarations.
