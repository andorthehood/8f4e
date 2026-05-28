---
title: 'TODO: Add dash argument continuation lines'
priority: Medium
effort: 2-4h
created: 2026-05-28
issue: null
status: Completed
completed: 2026-05-28
---

# TODO: Add dash argument continuation lines

## Problem Description

Long source argument lists are hard to read when they must stay on one line. This is especially noticeable for memory declarations with pointer defaults or intermodule references, such as:

```8f4e
float* readHead &source:samples
```

The language currently has no syntax-level way to wrap those arguments across multiple lines while preserving the existing instruction semantics.

## Proposed Solution

Add parser sugar for dash-prefixed argument continuation lines:

```8f4e
float*
- readHead
- &source:samples
```

The tokenizer/parser should fold this into the same AST shape as:

```8f4e
float* readHead &source:samples
```

This should happen before source argument validation, semantic normalization, namespace layout, stack analysis, or codegen. The compiler should not need a new semantic instruction for this behavior.

## Decisions

- A continuation line uses `-` as the instruction token.
- Each continuation line appends exactly one argument to the immediately preceding non-continuation instruction.
- Continuation lines are allowed after any source instruction. Existing argument validation remains responsible for rejecting invalid arity or argument shapes after folding.
- A bare `-` line is a syntax error.
- A continuation line without a preceding non-continuation instruction is a syntax error.

## Anti-Patterns

- Do not implement `-` as a semantic instruction. It should be parser sugar only.
- Do not let `float*` compile as an anonymous declaration before later continuation lines are considered.
- Do not treat `push -1` as a continuation. Continuation only applies when the instruction token is exactly `-`.
- Do not allow `- a b c` to append multiple arguments. One continuation line means one appended argument.

## Implementation Plan

### Step 1: Fold Continuation Lines During Parsing

- Update the tokenizer/parser source loop so `- <arg>` lines append their parsed argument token to the previous non-continuation source line.
- Preserve the original instruction line as the AST line identity for the merged instruction.
- Throw `SyntaxRulesError` for a bare `-`, a multi-argument `- a b`, or a continuation with no previous non-continuation instruction.

### Step 2: Validate Folded Instructions

- Run existing `validateInstructionArguments(...)` behavior against the folded argument list.
- Ensure invalid continuations produce syntax-level diagnostics because they are decidable from token and argument shape.

### Step 3: Add Tests

- Add tokenizer/parser tests showing that folded continuation lines produce the same AST as the equivalent single-line instruction.
- Cover memory declarations, a generic source instruction such as `push`, and invalid cases for bare `-`, multi-argument continuation, and missing previous instruction.
- Add or update compiler-level coverage if needed to prove semantic normalization and namespace layout receive the folded declaration correctly.

### Step 4: Document The Syntax

- Update the instruction/language docs to describe dash argument continuation lines.
- Include the `float*` pointer-default example and clarify that `-` is parser sugar, not a runtime or semantic instruction.

## Validation Checkpoints

- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/compiler:typecheck`

## Success Criteria

- [ ] `float*` declarations can be split across dash continuation lines and compile identically to the single-line form.
- [ ] Continuation lines work after any source instruction with source arguments.
- [ ] Bare, multi-argument, and orphaned continuation lines fail as syntax errors.
- [ ] Existing argument validation rejects folded instructions that exceed the target instruction's supported arity.
- [ ] Docs explain the syntax and the parser-sugar behavior.

## Affected Components

- `packages/compiler/packages/tokenizer/src/parser.ts` - Fold continuation lines before AST validation.
- `packages/compiler/packages/tokenizer/src/parser.test.ts` - Parser behavior and syntax-error coverage.
- `packages/compiler/src/semantic` - Should remain mostly unchanged; may only need integration tests.
- `packages/compiler/docs/instructions.md` or related docs - User-facing syntax documentation.

## Risks & Considerations

- **Compatibility**: The software has not been released yet, so this work may break internal and external APIs when that keeps the implementation simpler and cleaner.
- **Diagnostics**: Folded argument errors may initially point at the original instruction line rather than the continuation line. This is acceptable for the first implementation, but argument-level source metadata could improve it later.
- **Existing anonymous declarations**: Bare memory declarations such as `float*` are valid today, so continuation folding must happen before the declaration is interpreted semantically.
- **Markdown-like appearance**: `-` resembles a list marker outside code blocks, so docs should show continuation syntax inside fenced code blocks.

## Related Items

- **Related**: `377-batch-parse-modules-and-validate-shared-ids.md`
- **Related**: `378-make-parser-stateful-for-block-pairing-and-owning-block-context.md`

## Notes

- Design decision recorded on 2026-05-28: use dash continuation lines instead of an `arg` semantic instruction.
