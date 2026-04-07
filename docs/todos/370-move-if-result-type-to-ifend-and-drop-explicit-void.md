---
title: 'TODO: Move if result type to ifEnd and drop explicit void'
priority: Medium
effort: 4-8h
created: 2026-04-07
status: Open
completed: null
---

# TODO: Move if result type to ifEnd and drop explicit void

## Problem Description

The current `if` syntax declares the block result type on the opening instruction:

```txt
if int
  ...
ifEnd
```

That has two drawbacks:
- it does not match the desired source style where result shape is declared on the closing instruction
- it forces users to write `void` explicitly even though the absence of a result type already communicates the same meaning

Why this is a problem:
- the language is less consistent with `function ... functionEnd <returns>`
- the source syntax is more awkward than necessary for blocks that do not return a value
- the current user-facing form mirrors WebAssembly encoding details instead of the preferred surface-language design
- the compiler has not been released yet, so carrying compatibility syntax now would add unnecessary long-term complexity

## Proposed Solution

Change the source syntax for conditional blocks to:

```txt
if
  ...
ifEnd

if
  ...
ifEnd int

if
  ...
ifEnd float
```

Desired semantics:
- `if` takes no result-type argument
- `ifEnd` accepts zero or one result-type argument
- only `int` and `float` are valid explicit result types
- a bare `ifEnd` means the conditional block has no result
- explicit `void` is removed from the user-facing syntax

Implementation should preserve the current codegen expectation that the result type is known before emitting the opening WebAssembly `if`. The preferred approach is to normalize the new surface syntax into the current internal opening-block representation before codegen.

This change is intentionally breaking at the source syntax level:
- existing `if int`, `if float`, and `if void` forms should be removed
- no compatibility fallback or dual-syntax support should be added
- examples, docs, and tests should be updated to the new syntax directly

## Anti-Patterns

- Do not patch emitted bytecode after seeing `ifEnd`; normalize before codegen instead.
- Do not keep `if void` as a compatibility syntax path; the compiler is still unreleased.
- Do not keep `if int` or `if float` as compatibility syntax paths.
- Do not make `ifEnd` accept arbitrary identifiers; only `int` and `float` should be legal explicit result types.

## Implementation Plan

### Step 1: Update the surface syntax contract
- Adjust tokenizer/parser rules so `if` takes no result-type argument.
- Adjust `ifEnd` rules so it accepts zero or one explicit result type.
- Treat invalid `ifEnd` type arguments as syntax errors.
- Remove legacy opening-instruction type spellings instead of supporting both syntaxes.

### Step 2: Add a normalization rewrite
- Pair `if`/`else`/`ifEnd` structurally before codegen.
- Attach the `ifEnd` result type to the opening internal `if` representation.
- Normalize a bare `ifEnd` to a void/no-result internal block shape.

### Step 3: Keep semantic and codegen checks aligned
- Preserve result-value validation at block close.
- Ensure `else` branches still share the enclosing `if` block result type.
- Keep WebAssembly emission unchanged after normalization.

### Step 4: Update docs and tests
- Update instruction docs and examples to use the new syntax.
- Replace existing `if void` coverage with bare `ifEnd`.
- Add parser, normalization, and compiler regression tests for `ifEnd`, `ifEnd int`, and `ifEnd float`.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "\\bif void\\b|\\bif int\\b|\\bif float\\b|ifEnd (int|float)" packages/compiler docs packages/examples`

## Success Criteria

- [ ] `if` no longer accepts a result-type argument in source code.
- [ ] `ifEnd` is the only place where conditional block result type is declared.
- [ ] Bare `ifEnd` represents a no-result conditional block.
- [ ] Explicit `void` is removed from `if` syntax and examples.
- [ ] Compiler output and result-type validation remain correct after normalization.

## Affected Components

- `packages/compiler/packages/tokenizer/src/` - syntax validation for `if` and `ifEnd`
- `packages/compiler/src/semantic/normalization/` - structural rewrite from closing-type syntax to codegen-ready internal form
- `packages/compiler/src/instructionCompilers/if.ts` - codegen should consume normalized opening-block metadata
- `packages/compiler/src/instructionCompilers/ifEnd.ts` - stack/result validation should stay aligned with normalized block metadata
- `packages/compiler/docs/instructions/control-flow.md` - user-facing syntax documentation
- `packages/compiler/tests/` - parser, normalization, and compiler regression coverage

## Risks & Considerations

- **WASM encoding mismatch**: WebAssembly stores the block result type on the opening `if`, so normalization must happen before codegen.
- **Block pairing ownership**: the implementation needs a clear stage that owns pairing `if`, `else`, and `ifEnd`.
- **Error-boundary clarity**: invalid `ifEnd` type syntax belongs to syntax errors; stack/result mismatches remain compiler errors.

## Related Items

- **Related**: `371-move-block-result-type-to-blockend-and-drop-explicit-void.md`

## Notes

- This is a source-language cleanup, not a compatibility migration.
- Breaking API/source compatibility is expected here because the compiler is unreleased.
- The preferred internal model is still effectively `if <normalizedResultType> ... ifEnd`, but only after preprocessing the new surface syntax.
