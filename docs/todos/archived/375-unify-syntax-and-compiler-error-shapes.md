---
title: 'TODO: Unify syntax and compiler error shapes'
priority: Medium
effort: 4-8h
created: 2026-04-08
status: Done
completed: 2026-04-08
---

# TODO: Unify syntax and compiler error shapes

## Problem Description

The compiler currently exposes two different top-level error shapes:
- compiler/semantic errors expose location through `line` and optional `context`
- syntax/tokenizer errors expose location through `details`

This forces downstream consumers to understand internal implementation differences instead of relying on one stable diagnostic contract. In practice, editor-side code currently assumes compiler-style errors and falls back to defaults for syntax errors, which can produce degraded objects such as:

```json
{
  "lineNumber": 0,
  "codeBlockId": "",
  "message": "Too many arguments for if."
}
```

Why this is a problem:
- syntax errors lose useful line information when consumers only read `line`
- editor/runtime layers need special-case knowledge of tokenizer internals
- diagnostics are harder to reason about and harder to extend consistently
- `details` duplicates location responsibilities instead of being a clear contract boundary

## Proposed Solution

Unify syntax and compiler errors around one shared public shape.

Desired direction:
- both syntax and compiler errors expose `message`, `code`, optional `line`, and optional `context`
- syntax errors stop using `details` as the primary place for location metadata
- consumers read one consistent contract regardless of which compiler stage raised the error

Suggested target shape:

```ts
interface DiagnosticError {
  code: string | number;
  message: string;
  line?: {
    lineNumberBeforeMacroExpansion: number;
    lineNumberAfterMacroExpansion: number;
    instruction?: string;
    arguments?: unknown[];
  };
  context?: {
    codeBlockId?: string;
    codeBlockType?: 'module' | 'function' | 'constants';
  };
}
```

This change is intentionally breaking at the internal/public error-shape level:
- existing consumer assumptions about syntax errors exposing `details` should be removed
- no compatibility fallback or dual-shape support should be added
- all in-repo consumers should be updated to the unified shape directly

## Anti-Patterns

- Do not keep syntax location in `details` while also adding `line`; that preserves the ambiguity.
- Do not add adapter special cases in every consumer for “syntax vs compiler” errors.
- Do not keep a compatibility shim for the old syntax-error shape; the software is unreleased.
- Do not force syntax errors to invent fake compiler context if `codeBlockId` is not actually known yet.

## Implementation Plan

### Step 1: Define the unified diagnostic contract
- Choose the shared top-level fields for syntax and compiler errors.
- Prefer `line` and `context` as the only public location channels.
- Remove `details` unless a concrete remaining use case still justifies it.

### Step 2: Update syntax errors to match the contract
- Change `SyntaxRulesError` to carry `line` directly.
- Update parser/tokenizer throw sites to populate `line` instead of `details`.
- Preserve current syntax error codes and messages while changing the shape.

### Step 3: Update consumers to the unified shape
- Simplify editor/compiler-worker adapters to read only `message`, `code`, `line`, and `context`.
- Remove syntax-specific fallback logic in error display/mapping paths.
- Keep `context` optional for syntax errors until block identity is explicitly available.

### Step 4: Add regression coverage
- Add tests for syntax errors exposing the expected `line` fields.
- Add tests for editor-side error adaptation so syntax errors no longer collapse to `lineNumber: 0`.
- Verify compiler errors still expose the same usable line/context shape after the refactor.

## Validation Checkpoints

- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/editor-state:test`
- `rg -n "\\bdetails\\b|lineNumberBeforeMacroExpansion|codeBlockId" packages/compiler packages/editor packages/compiler-worker`

## Success Criteria

- [ ] Syntax and compiler errors expose one consistent top-level shape.
- [ ] Syntax errors expose line information through `line`, not `details`.
- [ ] Editor-side compilation error handling no longer defaults syntax errors to `lineNumber: 0`.
- [ ] No compatibility fallback remains for the old syntax-error shape.
- [ ] Consumers outside the tokenizer/compiler internals no longer need to know which compiler stage produced the error.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/syntaxError.ts` - syntax error class shape
- `packages/compiler/packages/tokenizer/src/parser.ts` - syntax error wrapping/population of line metadata
- `packages/compiler/src/types.ts` - shared compiler diagnostic typing
- `packages/compiler/src/compilerError.ts` - ensure compiler errors align with the same contract
- `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts` - editor-side error adaptation
- `packages/compiler-worker/` - any worker-side error serialization or forwarding paths
- `packages/compiler/tests/` and `packages/compiler/packages/tokenizer/src/` - regression coverage

## Risks & Considerations

- **Consumer churn**: changing the shared error shape can ripple through editor and worker code quickly.
- **Half-migration risk**: leaving some consumers on `details` and others on `line` would preserve the confusion.
- **Context availability**: syntax errors may still legitimately lack `codeBlockId`; unifying the shape should not imply inventing context that does not exist.

## Related Items

- **Related**: `292-refactor-error-systems-and-document-syntax-vs-compiler-error-boundaries.md`

## Notes

- Breaking compatibility is expected here because the software is unreleased.
- The goal is not richer diagnostics first; it is a cleaner and more reliable contract for all current diagnostics.
