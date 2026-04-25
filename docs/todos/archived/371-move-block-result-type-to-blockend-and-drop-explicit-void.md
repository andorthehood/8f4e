---
title: 'TODO: Move block result type to blockEnd and drop explicit void'
priority: Medium
effort: 4-8h
created: 2026-04-07
status: Completed
completed: 2026-04-25
---

# TODO: Move block result type to blockEnd and drop explicit void

## Problem Description

The current `block` syntax declares the block result type on the opening instruction:

```txt
block int
  ...
blockEnd
```

This mirrors current `if` behavior, but it has the same source-language problems:
- the result shape is declared at the start instead of the end
- `void` appears as an explicit type even though omitting the type should be sufficient
- the surface syntax is shaped by WebAssembly encoding rather than the intended language style

Why this is a problem:
- `block` becomes inconsistent with the desired `if ... ifEnd [type]` direction
- the language keeps an unnecessary explicit `void` spelling
- raw control-flow blocks become less uniform with `function ... functionEnd <returns>`
- the compiler has not been released yet, so preserving old syntax would add avoidable compatibility debt

## Proposed Solution

Change the source syntax for generic blocks to:

```txt
block
  ...
blockEnd

block
  ...
blockEnd int

block
  ...
blockEnd float
```

Desired semantics:
- `block` takes no result-type argument
- `blockEnd` accepts zero or one result-type argument
- only `int` and `float` are valid explicit result types
- a bare `blockEnd` means the block has no result
- explicit `void` is removed from the user-facing syntax

As with `if`, the compiler should normalize this surface syntax into an internal form where the opening block already knows its result type before WebAssembly codegen runs.
As with `if`, the preferred implementation is now parser-owned structural pairing with source-faithful AST lines:
- `block` should remain `block` with no synthetic result-type argument injected
- `blockEnd int` / `blockEnd float` should keep their source arguments intact
- the tokenizer/parser should pair `block` with `blockEnd` and attach metadata to the AST so codegen can read the result type from the opening block without rewriting the source representation

This change is intentionally breaking at the source syntax level:
- existing `block int`, `block float`, and `block void` forms should be removed
- no compatibility fallback or dual-syntax support should be added
- examples, docs, and tests should be updated to the new syntax directly

## Anti-Patterns

- Do not special-case `block void` as a tolerated legacy form.
- Do not keep `block int` or `block float` as tolerated legacy forms.
- Do not add a compiler-side normalization pass that moves `blockEnd` arguments back onto `block`.
- Do not duplicate a second block-type inference path inside codegen.
- Do not move branch-depth-sensitive lowering ahead of block pairing/normalization.

## Implementation Plan

### Step 1: Update the surface syntax contract
- Adjust tokenizer/parser rules so `block` takes no result-type argument.
- Adjust `blockEnd` rules so it accepts zero or one explicit result type.
- Treat invalid `blockEnd` type arguments as syntax errors.
- Remove legacy opening-instruction type spellings instead of supporting both syntaxes.

### Step 2: Normalize closing-type syntax to opening-block metadata
- Make the tokenizer/parser stateful enough to pair `block` and `blockEnd` while building the AST.
- Extend the current parser-owned block-pairing approach used for `if` so `block`/`blockEnd` get the same kind of source-faithful linkage metadata.
- Keep the AST source-faithful and attach block-pairing metadata rather than rewriting instruction arguments.
- Represent a bare `blockEnd` as a no-result block in metadata, not by injecting synthetic `void`.

### Step 3: Preserve branch and stack semantics
- Keep existing block result validation at close.
- Ensure branching depth semantics still refer to the same parser-paired block structure.
- Keep WebAssembly emission unchanged apart from reading parser-provided metadata instead of opening-line arguments.

### Step 4: Update docs and tests
- Update instruction docs and examples to use the new syntax.
- Replace existing `block void` examples with bare `block` / `blockEnd`.
- Add parser and compiler regression tests for `blockEnd`, `blockEnd int`, and `blockEnd float`.
- Add syntax tests for structural block errors such as unexpected `blockEnd` and unclosed `block`.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "\\bblock void\\b|\\bblock int\\b|\\bblock float\\b|blockEnd (int|float)" packages/compiler docs packages/examples`

## Success Criteria

- [ ] `block` no longer accepts a result-type argument in source code.
- [ ] `blockEnd` is the only place where generic block result type is declared.
- [ ] Bare `blockEnd` represents a no-result block.
- [ ] Explicit `void` is removed from `block` syntax and examples.
- [ ] The AST remains source-faithful while still carrying enough metadata for codegen.
- [ ] Branching and stack validation behavior remain correct after parser-owned pairing.

## Affected Components

- `packages/compiler/packages/tokenizer/src/` - syntax validation for `block` and `blockEnd`
- `packages/compiler/packages/tokenizer/src/parser.ts` - parser-owned block pairing and AST metadata attachment
- `packages/compiler/packages/tokenizer/src/types.ts` - AST metadata for paired `block` / `blockEnd`
- `packages/compiler/packages/tokenizer/src/parser.ts` - extend the current `if` pairing machinery to cover `block` / `blockEnd` as well
- `packages/compiler/src/instructionCompilers/block.ts` - codegen should consume parser-provided block metadata
- `packages/compiler/src/instructionCompilers/blockEnd.ts` - stack/result validation should stay aligned with parser-provided block metadata
- `packages/compiler/docs/instructions/control-flow.md` - user-facing syntax documentation
- `packages/compiler/tests/` - parser and compiler regression coverage

## Risks & Considerations

- **WASM encoding mismatch**: WebAssembly stores the block result type on the opening `block`, so the parser-owned metadata must provide that information before codegen emits the opening opcode.
- **Branch-depth coupling**: block pairing must remain stable before any branch-target-sensitive lowering or validation runs.
- **Parser boundary growth**: tokenizer/parser structural ownership should stay limited to pairing and block-shape validation, not stack/type semantics.
- **Shared design pressure**: if `if` and `block` diverge here, the language becomes harder to explain; this change should stay aligned with the corresponding `if` syntax cleanup.

## Related Items

- **Related**: `370-move-if-result-type-to-ifend-and-drop-explicit-void.md`

## Notes

- This change is primarily about source-language consistency and removing unnecessary syntax noise.
- Breaking API/source compatibility is expected here because the compiler is unreleased.
- Follow the same design as the implemented `if` change: parser-owned structural pairing, source-faithful AST, and no synthetic compatibility rewrite.
