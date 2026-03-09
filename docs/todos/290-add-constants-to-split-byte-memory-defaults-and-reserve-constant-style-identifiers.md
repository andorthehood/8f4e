---
title: 'TODO: Add Constants to Split-Byte Memory Defaults and Reserve Constant-Style Identifiers'
priority: Medium
effort: 1-2d
created: 2026-03-09
status: Open
completed: null
---

# TODO: Add Constants to Split-Byte Memory Defaults and Reserve Constant-Style Identifiers

## Problem Description

Split-byte memory defaults are evolving to support hex and decimal byte tokens, but they still need a clear story for compile-time constants.

Desired examples:
- `const HI 32`
- `const LO 64`
- `int foo HI LO`
- `int HI LO`

Allowing constants in split-byte notation is technically straightforward, but anonymous declarations like `int HI LO` require the language to distinguish clearly between:
- named memory declarations
- anonymous declarations seeded from constants

The codebase already treats all-uppercase names as constant-style identifiers, but memory declarations do not yet explicitly reserve that namespace. Without a hard rule, declarations like `int HI 0` can remain ambiguous or inconsistent across compiler and editor surfaces.

## Proposed Solution

Extend split-byte memory defaults so any token is accepted if it resolves at compile time to an exact integer byte in the range `0..255`.

Accepted split-byte token sources should include:
- decimal literals
- hex literals
- constants

Key rules:
- A single token keeps existing declaration behavior.
- Two or more byte-resolving tokens trigger split-byte mode.
- Tokens are resolved first, then validated as integer bytes `0..255`, then packed left-to-right.
- Anonymous declarations should support constant-only split-byte forms such as `int HI LO`.
- Memory allocation identifiers must not match constant-style naming rules.

Recommended identifier rule:
- Reject memory identifiers that satisfy `isConstantName(...)`.
- This intentionally reserves constant-style names for constants only.
- Breaking this syntax is acceptable because the software is not released yet.

Examples:
- `const HI 32`
- `const LO 64`
- `int foo HI LO` => named allocation `foo` with default `0x20400000`
- `int HI LO` => anonymous allocation with default `0x20400000`
- `int HI` => anonymous allocation using constant `HI` as the single default value

## Anti-Patterns

- Do not allow non-integer or out-of-range constants in split-byte mode.
- Do not keep accepting constant-style identifiers as memory names once the new rule is added.
- Do not document split-byte constants only partially; this needs full language-level documentation because it affects parsing expectations.
- Do not make compiler and editor disagree about whether `int HI LO` is anonymous or named.

## Implementation Plan

### Step 1: Allow constants in split-byte resolution
- Update split-byte detection/resolution so identifier tokens can participate when they resolve to compile-time constants.
- Enforce exact integer byte validation after resolution.
- Reject constants that resolve to negatives, floats, or values above `255`.

### Step 2: Reserve constant-style identifiers
- Enforce that memory allocation identifiers cannot satisfy `isConstantName(...)`.
- Apply the rule consistently in compiler validation and any editor/parser assumptions.
- Add regression tests showing that constant-style memory names are rejected.

### Step 3: Align anonymous declaration handling
- Ensure anonymous split-byte declarations work with constant tokens: `int HI LO`.
- Preserve existing single-token anonymous constant behavior if already supported.
- Add tests for named vs anonymous constant-driven declarations.

### Step 4: Add comprehensive documentation
- Update declaration docs with full syntax coverage for hex, decimal, and constant split-byte defaults.
- Document the one-token vs multi-token rule clearly.
- Document the reserved constant-style identifier rule explicitly.
- Include examples for named, anonymous, mixed-token, and invalid forms.

## Validation Checkpoints

- `rg -n "isConstantName|split-byte|HI LO|constant-style" packages/compiler packages/editor docs`
- `npx nx run-many --target=test --projects=compiler`

## Success Criteria

- [ ] `int foo HI LO` compiles when `HI` and `LO` resolve to integer bytes in `0..255`.
- [ ] `int HI LO` works as an anonymous split-byte declaration.
- [ ] Split-byte constants outside `0..255`, negative values, or non-integers fail with explicit errors.
- [ ] Memory allocation identifiers matching constant-style naming are rejected consistently.
- [ ] Compiler docs comprehensively describe split-byte defaults, constant participation, and reserved identifier rules.

## Affected Components

- `packages/compiler/src/syntax/memoryInstructionParser.ts` - Extend split-byte parsing to include constant identifiers.
- `packages/compiler/src/utils/memoryInstructionParser.ts` - Resolve constant tokens, validate byte constraints, and preserve anonymous behavior.
- `packages/compiler/src/instructionCompilers/int.ts` - Consume resolved defaults unchanged after parser updates.
- `packages/compiler/src/syntax/isConstantName.ts` - Reuse existing constant-style naming rule as the memory-name restriction boundary.
- `packages/compiler/tests` - Add coverage for constants in split-byte mode and reserved memory-name validation.
- `packages/editor/packages/editor-state/src/features/code-blocks/features/outputs/codeParser.ts` - Keep editor-side anonymous detection aligned with compiler behavior.
- `packages/compiler/docs/instructions/declarations-and-locals.md` - Add comprehensive documentation for the final syntax.

## Risks & Considerations

- **Breaking syntax**: Existing unreleased code using constant-style memory identifiers will break once the restriction is enforced.
- **Parser ambiguity**: Compiler and editor must agree on anonymous detection for uppercase-first declarations.
- **Documentation burden**: This feature crosses parsing, constants, and declaration naming rules, so partial docs will cause confusion.
- **Constant resolution semantics**: The implementation must validate resolved values after expression handling, not just raw token shape.

## Related Items

- **Related**: `docs/todos/288-add-split-hexadecimal-memory-defaults.md`
- **Related**: `docs/todos/289-add-decimal-split-byte-memory-defaults.md`

## Notes

- Initial decision: constant-style names should be reserved for constants only.
- Initial decision: `int HI LO` should be treated as anonymous split-byte declaration, not as a named allocation.
- Initial decision: comprehensive documentation is part of the feature, not follow-up cleanup.
