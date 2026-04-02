---
title: 'TODO: Refactor error systems and document syntax vs compiler error boundaries'
priority: Medium
effort: 1-2d
created: 2026-03-09
status: Completed
completed: 2026-04-02
---

# TODO: Refactor error systems and document syntax vs compiler error boundaries

## Problem Description

The compiler currently has two different error systems:
- `packages/compiler/src/syntax/syntaxError.ts` with `SyntaxRulesError` and `SyntaxErrorCode`
- `packages/compiler/src/errors.ts` with `ErrorCode` and `getError(...)`

These systems do not follow the same design:
- `SyntaxRulesError` requires both an error code and a manually supplied message string
- `errors.ts` centralizes message construction behind `getError(...)`

At the same time, the boundary between syntax errors and compiler errors is not documented clearly enough. Some errors in `errors.ts` can look syntax-related by name, but the real distinction should be based on compilation phase:
- syntax errors: structurally invalid source before semantic analysis
- compiler errors: semantically invalid program after syntax is already valid

Without an explicit policy, future changes can place new errors in the wrong system and keep duplicating messages at throw sites.

## Proposed Solution

Refactor the error architecture so both syntax and compiler errors follow the same general pattern:
- stable error code
- centrally defined default message
- optional structured context for formatting/debugging

Broaden the work beyond `SyntaxRulesError` into a full cleanup with clear naming and documentation.

Recommended outcomes:
- Rename `packages/compiler/src/errors.ts` to something phase-specific such as `compilerError.ts` or `compilerErrors.ts`.
- Keep syntax and compiler errors as separate domains, but document their boundary clearly.
- Refactor `SyntaxRulesError` so the code owns the default message instead of requiring repeated throw-site prose.
- Optionally refactor the compiler error `switch` into a central registry/formatter map for consistency.
- Add explicit comment blocks at the top of both error modules describing when each should be used.
- Add short guidance to `AGENTS.md` so future agents choose the correct error domain.

## Boundary Definition

Use compilation phase as the distinction:

Syntax errors:
- the source form is structurally invalid before semantic analysis
- can be detected from token/argument shape alone
- do not require symbol resolution, stack state, scope validation, type checking, or runtime-model knowledge

Examples:
- malformed literal syntax
- missing required argument shape
- invalid declaration shape
- invalid pointer-depth syntax
- malformed prefix/suffix syntax
- constant naming rule violations when enforced lexically

Compiler errors:
- syntax is already valid, but the program is semantically invalid
- require semantic analysis or compiler state

Examples:
- undeclared identifier
- type mismatch
- invalid instruction in current scope
- stack mismatch
- illegal memory access in pure functions
- duplicate semantic declarations
- constant resolution failures

Decision rule:
- if an error can be detected before building semantic context, prefer syntax error
- otherwise use compiler error

## Anti-Patterns

- Do not keep `SyntaxRulesError` as the only subsystem that requires repeated custom messages at throw sites.
- Do not classify errors by how they sound; classify them by detection phase.
- Do not mix syntax and semantic errors in the same module without documenting why.
- Do not leave future contributors guessing where a new error belongs.

## Implementation Plan

### Step 1: Rename and clarify compiler error module
- Rename `packages/compiler/src/errors.ts` to `compilerError.ts` or `compilerErrors.ts`.
- Update imports and tests accordingly.
- Add a module-level comment that defines compiler/semantic errors and when to use them.

### Step 2: Refactor `SyntaxRulesError`
- Change `SyntaxRulesError` so `SyntaxErrorCode` becomes the canonical source of the default message.
- Add a central message registry or formatter map for syntax errors.
- Allow structured context for details and interpolation.
- Keep explicit message override only if a strong exception case remains.

### Step 3: Align compiler error construction
- Review whether `getError(...)` should remain a `switch` or move to a central registry/formatter map.
- Reduce repeated `(${code})` and other boilerplate where practical.
- Keep compiler error codes stable unless there is a strong reason to rename them.

### Step 4: Document the boundary explicitly
- Add top-of-file policy comments to both syntax and compiler error modules.
- Add short guidance to root `AGENTS.md` describing the distinction for future work.
- Optionally add a brief note in compiler docs or contributor docs if there is a suitable place.

### Step 5: Audit and migrate error sites
- Review existing syntax and compiler throw sites for misclassified errors.
- Move obvious structure-only cases into syntax errors where appropriate.
- Keep semantic/state-dependent cases in compiler errors.
- Update tests intentionally if message wording changes under centralized formatting.

## Validation Checkpoints

- `rg -n "SyntaxRulesError|SyntaxErrorCode" packages/compiler/src`
- `rg -n "getError\\(|ErrorCode" packages/compiler/src`
- `rg -n "syntax error|compiler error|semantic" AGENTS.md packages/compiler/src`
- `npx nx run-many --target=test --projects=compiler`

## Success Criteria

- [ ] Syntax and compiler errors are documented as separate domains with a clear phase-based boundary.
- [ ] `errors.ts` is renamed to a compiler-specific name.
- [ ] `SyntaxRulesError` no longer requires repeated custom prose at most throw sites.
- [ ] Default messages for both syntax and compiler errors are centrally defined.
- [ ] Root `AGENTS.md` includes concise guidance on where new errors should go.

## Affected Components

- `packages/compiler/src/syntax/syntaxError.ts` - Refactor syntax error construction and add policy comments.
- `packages/compiler/src/errors.ts` or renamed replacement - Clarify compiler error role and possibly refactor message registry.
- `packages/compiler/src/syntax` - Update syntax throw sites to use centralized messages/context.
- `packages/compiler/src` - Update `getError(...)` imports after rename.
- Root `AGENTS.md` - Add guidance for future agents/contributors on choosing syntax vs compiler errors.
- `packages/compiler/tests` - Update tests for renamed modules and any message changes.

## Risks & Considerations

- **Import churn**: Renaming `errors.ts` will touch many files.
- **Test churn**: Canonicalizing messages may require broad expectation updates.
- **Boundary gray areas**: Some existing errors may sit near the phase boundary and require deliberate judgement.
- **Scope growth**: Keep the refactor focused on architecture and classification, not a full rewrite of every error at once unless it remains manageable.

## Related Items

- **Related**: `docs/todos/290-add-constants-to-split-byte-memory-defaults-and-reserve-constant-style-identifiers.md`
- **Related**: `docs/todos/291-add-int64-support-across-compiler-runtime-and-docs.md`

## Notes

- Initial preference: keep syntax and compiler errors separate, but make them architecturally consistent.
- Initial preference: classify errors by detection phase, not by wording.
- Initial preference: add concise policy comments in code and a short rule in `AGENTS.md` so future agents pick the right place.
