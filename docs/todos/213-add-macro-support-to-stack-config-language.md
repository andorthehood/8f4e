---
title: 'TODO: Add Macro Support to Stack Config Language'
priority: Medium
effort: 2-3d
created: 2026-02-08
status: Open
completed: null
---

# TODO: Add Macro Support to Stack Config Language

## Problem Description

The stack config language currently has no macro/template feature, so repeated config-building sequences must be copy-pasted. This makes config programs verbose and harder to refactor.

`defineMacro` / `defineMacroEnd` support is already implemented in `@8f4e/compiler`, but that behavior is not yet available in `@8f4e/stack-config-compiler`.

For parity with compiler macro work, stack-config macros should preserve useful error attribution. Without explicit mapping, expanded macro lines can produce parse/exec/schema errors that point to generated lines instead of the original `macro <name>` call site, which is harder to debug.

## Proposed Solution

Add a preprocessing macro-expansion phase to `@8f4e/stack-config-compiler` before normal parse/execute flow, reusing shared macro parsing/expansion logic with `@8f4e/compiler` where practical.

Scope for v1:
- Reuse existing macro block syntax: `defineMacro <name>` / `defineMacroEnd`.
- Expand macro calls via `macro <name>`.
- Keep macro definitions as separate source input (similar to compiler macro), not mixed into the main config program.
- Disallow nested macro definitions and macro calls inside macro bodies in v1.
- Preserve call-site mapping so expanded commands report the `macro <name>` call-site line.
- Include macro identity in errors (for example a `macroId` field) so users can see which macro expansion triggered a failure.

### Agreed Integration Contract

- In editor compilation flow, filter macro code blocks from the same code-block list already used for `@8f4e/compiler`.
- Pass filtered macros to `@8f4e/stack-config-compiler` as a separate argument (not inline in config source), mirroring current compiler macro wiring.
- Keep macro-block type/source-of-truth shared so both compilers consume the same macro definitions.

## Anti-Patterns

- Expanding macro bodies while keeping original body line numbers in user-facing errors.
- Allowing nested/recursive macro expansion in the first iteration.
- Treating `defineMacro` instructions as runtime stack-config commands.

## Implementation Plan

### Step 1: Add macro expansion utility with mapping metadata
- Extract/adapt the existing compiler macro parser/expander into shared utility code.
- Wire stack-config-compiler to consume the shared macro utility instead of reimplementing macro rules from scratch.
- Parse and validate `defineMacro` blocks from macro source input:
  - duplicate names -> compile error
  - missing `defineMacroEnd` -> compile error
  - nested `defineMacro` or `macro` inside macro bodies -> compile error
- Expand `macro <name>` calls into source lines annotated with:
  - `callSiteLineNumber`
  - `macroId` (macro name)

### Step 2: Integrate expansion into compile pipeline
- Extend `compileConfig` input to accept optional macro sources.
- Expand main source with macro metadata before normal `parse`.
- Thread call-site mapping into parsed commands so `lineNumber` on expanded commands points to call-site lines.
- Extend error shape to optionally include macro identity (for parse/exec/schema errors triggered from expanded macro commands).
- Update editor config compilation path to pass filtered macro blocks as the new separate stack-config-compiler argument.

### Step 3: Add tests for expansion and error mapping
- Unit tests for macro parsing/validation/expansion.
- Integration tests that verify parse, exec, and schema errors from expanded content report:
  - call-site line
  - macro identity
- Regression tests for undefined macro, duplicate macro, and missing macro end cases.

## Validation Checkpoints

- `npx nx run stack-config-compiler:test`
- `npx nx run stack-config-compiler:typecheck`
- `rg -n "defineMacro|defineMacroEnd|macro " packages/stack-config-compiler/src`

## Success Criteria

- [ ] Stack-config macros can be defined and expanded from separate macro source input.
- [ ] Macro parsing/validation semantics are shared with `@8f4e/compiler` (single source of truth or equivalent shared utility).
- [ ] Errors originating from expanded macro commands report the `macro <name>` call-site line.
- [ ] Errors include macro identity for expanded commands.
- [ ] Duplicate/missing/undefined macro scenarios report clear compile errors.
- [ ] Nested macro usage is rejected in v1.
- [ ] Stack-config compiler tests cover macro expansion and error mapping behavior.

## Affected Components

- `packages/compiler/src/utils/macroExpansion.ts` - extraction/refactor candidate for shared macro logic.
- `packages/stack-config-compiler/src/index.ts` - compile API and expansion wiring.
- `packages/stack-config-compiler/src/types.ts` - command/error metadata for macro attribution.
- `packages/stack-config-compiler/src/parser/` - parse flow updates to consume expanded/mapped source.
- `packages/stack-config-compiler/src/vm/` - ensure exec errors preserve mapped line and macro metadata.
- `packages/stack-config-compiler/src/schema/` - ensure schema errors from expanded commands preserve mapped line and macro metadata.
- `packages/stack-config-compiler/src/__tests__/` - macro expansion and mapping tests.
- Editor compile/effects layer that currently filters macro blocks for compiler input - extend to also pass the same filtered macro blocks to stack-config-compiler.

## Risks & Considerations

- **Error mapping consistency**: parse, exec, and schema errors currently have different construction paths; all must carry mapping consistently.
- **Cross-compiler coupling**: shared utility API should stay compiler-agnostic and avoid leaking compiler-specific internals.
- **API design**: compile API should remain simple while allowing separate macro input.
- **Backward compatibility**: additive feature, but type changes (error shape/options) may affect consumers.
- **Complexity creep**: avoid recursive macro behavior in v1.

## Related Items

- **Related**: `docs/todos/archived/208-compiler-macros-error-mapping.md`
- **Related**: `docs/todos/183-add-macro-blocks-and-expansion.md`
- **Related**: `docs/todos/archived/173-add-scoped-constants-stack-config-compiler.md`

## Notes

- `defineMacro` / `defineMacroEnd` already exist in compiler macros; reuse those semantics unless there is a strong stack-config-specific reason to diverge.
- Prefer explicit naming (`callSiteLineNumber`, `macroId`) in mapping metadata to keep error attribution easy to reason about.
