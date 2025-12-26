---
title: 'TODO: Extract syntax parsing and errors into syntax-rules'
priority: Medium
effort: 1-2 days
created: 2025-12-25
status: Completed
completed: 2025-12-26
---

# TODO: Extract syntax parsing and errors into syntax-rules

## Problem Description

Compiler utilities currently mix syntax parsing, identifier shape checks, and semantic validation. This makes it harder to reuse parsing logic across packages (editor, compiler) and blurs the boundary between syntax and semantics. Some syntax validation also raises compiler errors directly, even when the issue is purely syntactic.

## Proposed Solution

Move syntax-only parsing and validation into `@8f4e/syntax-rules`, along with a dedicated syntax error type. Keep semantic checks and compiler error codes in the compiler, and wrap syntax-rules errors there.

## Implementation Plan

### Step 1: Add syntax parsing helpers and errors
- Introduce string-shape helpers for memory identifier prefixes and pointer depth in `@8f4e/syntax-rules`.
- Add a syntax-oriented argument parser for memory instructions that classifies argument shapes without touching compiler state.
- Define a `SyntaxError` (and codes) for pure syntax failures.

### Step 2: Refactor compiler utilities
- Split `parseMemoryInstructionArguments` into syntax and semantic layers.
- Catch `SyntaxError` in the compiler and wrap it with existing compiler error formatting.
- Keep memory/const lookups and module/function validation inside compiler.

### Step 3: Update tests and docs
- Add unit tests in `packages/syntax-rules/tests` for new helpers and errors.
- Adjust compiler tests to cover wrapped syntax errors.
- Update `docs/instructions.md` or other language docs if the syntax rules change is user-visible.

## Success Criteria

- [ ] Syntax-only helpers and a syntax error type live in `@8f4e/syntax-rules`.
- [ ] Compiler uses syntax-rules parsing and wraps syntax errors into compiler errors.
- [ ] Tests cover new syntax rules and error wrapping behavior.

## Affected Components

- `packages/syntax-rules` - new helpers and syntax error type.
- `packages/compiler` - split parsing/validation and error wrapping.
- `docs/instructions.md` - update if syntax behavior is clarified or exposed.

## Risks & Considerations

- **Error mapping**: ensure syntax error codes map cleanly to compiler-facing errors.
- **Dependency direction**: avoid syntax-rules importing compiler types or errors.
- **Compatibility**: public API changes in syntax-rules may affect editor-state users.

## Related Items

- Related: consolidation of syntax logic in `@8f4e/syntax-rules`.

## References

- `packages/compiler/src/utils.ts`
- `packages/syntax-rules/src`

## Notes

- None.
