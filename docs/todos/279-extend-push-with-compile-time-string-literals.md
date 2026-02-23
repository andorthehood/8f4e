---
title: 'TODO: Extend push with compile-time string literals'
priority: High
effort: 4-8h
created: 2026-02-23
status: Open
completed: null
---

# TODO: Extend push with compile-time string literals

## Problem Description

`push` currently accepts numeric literals and identifiers, but does not support string literals. This makes byte-sequence construction verbose because users must manually push each ASCII code.

Target user flow:

```8f4e
push "hello"
```

Expected behavior:
- compile-time expansion to byte pushes equivalent to:
  - `push 104`
  - `push 101`
  - `push 108`
  - `push 108`
  - `push 111`

## Proposed Solution

Extend the parser and `push` instruction compiler so quoted string literals are accepted and expanded at compile time into individual byte pushes in source order.

Semantics:
- `push "..."` emits one `i32.const` per byte in the string.
- Escapes are supported (for example `\"`, `\\`, `\n`, `\r`, `\t`, `\xNN`).
- Each emitted value is in range `0..255`.
- No implicit null terminator is appended in MVP.

## Anti-Patterns

- Do not introduce runtime string objects or heap allocation.
- Do not change existing numeric/identifier behavior of `push`.
- Do not implicitly append `0` terminators.

## Implementation Plan

### Step 1: Extend instruction parsing for quoted arguments
- Update syntax parsing so a single quoted argument can contain spaces.
- Ensure semicolon comments still work and quoted semicolons are preserved inside the string.

### Step 2: Extend argument model for string literal type
- Add a string literal argument type in parser/types.
- Decode supported escape sequences during parse.

### Step 3: Extend `push` instruction compiler
- Detect parsed string-literal argument.
- Expand to per-byte `i32.const` instructions in order.
- Push corresponding stack metadata entries for each emitted byte as integer stack values.

### Step 4: Tests
- Add parser tests for quoted strings, spaces, comments, and escapes.
- Add `push` compiler tests that verify bytecode ordering and stack growth.
- Add regression tests for existing non-string `push` paths.

### Step 5: Docs
- Update `packages/compiler/docs/instructions/stack.md` with string-literal examples.
- Update `packages/compiler/docs/instructions.md` if needed for syntax notes.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:test -- --run instructionCompilers`
- `rg -n "push \\\"|string literal|\\\\x" packages/compiler/src packages/compiler/docs`

## Success Criteria

- [ ] `push "hello"` compiles to byte-equivalent pushes in source order.
- [ ] Escapes are decoded correctly (`\n`, `\t`, `\\`, `\"`, `\xNN`).
- [ ] Existing numeric and identifier push behavior is unchanged.
- [ ] Documentation includes string push examples and escape semantics.

## Affected Components

- `packages/compiler/src/syntax/instructionParser.ts`
- `packages/compiler/src/syntax/parseArgument.ts`
- `packages/compiler/src/types.ts` (if argument typing needs update)
- `packages/compiler/src/instructionCompilers/push.ts`
- `packages/compiler/docs/instructions/stack.md`

## Risks & Considerations

- **Parser complexity**: quoted argument support must not break current tokenization behavior.
- **Escape correctness**: malformed escape handling needs clear compiler errors.
- **Large strings**: many emitted push ops can increase bytecode size.

## Related Items

- **Related**: `docs/todos/277-add-storebytes-with-explicit-byte-count.md`
- **Related**: `docs/todos/278-add-storewords-with-explicit-count-and-word-size.md`

## Notes

- This TODO is intentionally scoped to compile-time expansion only.
