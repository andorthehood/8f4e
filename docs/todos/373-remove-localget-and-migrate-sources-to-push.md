---
title: 'TODO: Remove `localGet` and migrate sources to `push`'
priority: Medium
effort: 4-8h
created: 2026-04-07
status: Open
completed: null
---

# TODO: Remove `localGet` and migrate sources to `push`

## Problem Description

This TODO depends on `372-make-push-local-equivalent-to-localget.md`.

Once `push <local>` is fully equivalent to `localGet <local>`, keeping both source-level forms adds unnecessary surface area to the language.

`localGet` currently appears across compiler tests, docs, examples, editor syntax-highlighting keywords, and internal compiler-generated source snippets. Leaving it in place after `push <local>` reaches parity would preserve a redundant instruction and force the codebase to keep documenting and testing two ways to express the same operation.

The compiler is still pre-release, so this is the right time to make the breaking cleanup directly instead of carrying compatibility baggage.

## Proposed Solution

Remove the `localGet` instruction from the language surface and migrate all compiler-owned source, docs, tests, and examples to use `push <local>` instead.

Key constraints:
- do not add fallback parsing or compatibility aliases
- do not keep `localGet` accepted “for now”
- update source fixtures and examples directly
- treat this as an intentional breaking change in a pre-release compiler

## Anti-Patterns

- Do not add tokenizer- or compiler-level fallback logic that rewrites `localGet` to `push`.
- Do not keep `localGet` in syntax highlighting, docs, or examples after removal.
- Do not split the migration into “soft deprecation” and “real removal” phases unless a concrete blocker appears.

## Implementation Plan

### Step 1: Remove language support
- Delete tokenizer/compiler support for the `localGet` instruction.
- Remove the dedicated instruction compiler and any dispatch/typing references that exist only for `localGet`.

### Step 2: Migrate compiler-owned source generation
- Update compiler-generated instruction segments that currently emit `localGet ...` so they emit `push ...` instead.
- Keep generated semantics identical to the pre-removal behavior.

### Step 3: Migrate tests and fixtures
- Replace `localGet` with `push` in compiler tests, fixtures, snapshots, and sample programs.
- Update assertions or snapshots only where the source surface changed intentionally.

### Step 4: Migrate docs and examples
- Update instruction docs, function docs, macro docs, examples, and editor-facing syntax references to use `push` for local reads.
- Remove `localGet` from instruction listings and syntax-highlighting keyword sets.

### Step 5: Verify breakage surface
- Confirm there are no remaining `localGet` references in active source, docs, tests, and examples outside archived notes or historical records.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run-many --target=test --all`
- `rg -n "\\blocalGet\\b" packages src docs --glob '!**/dist/**' --glob '!docs/todos/archived/**'`
- `rg -n "'localGet'|\"localGet\"" packages src --glob '!**/dist/**'`

## Success Criteria

- [ ] `localGet` is no longer accepted as a source instruction.
- [ ] Compiler-owned generated source uses `push` for local reads.
- [ ] Active tests, examples, fixtures, and docs no longer use `localGet`.
- [ ] No compatibility fallback logic was added.

## Affected Components

- `packages/compiler/packages/tokenizer`
- `packages/compiler/src/instructionCompilers`
- `packages/compiler/src/types.ts`
- `packages/compiler/tests`
- `packages/compiler/docs`
- `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts`
- `packages/examples`
- `packages/cli/tests/fixtures`

## Risks & Considerations

- **Intentional breakage**: Existing unreleased source that uses `localGet` will stop compiling until migrated.
- **Generated-source drift**: Compiler helpers that emit mini source segments must be migrated consistently or internal behavior may diverge.
- **Snapshot churn**: This cleanup will touch many tests and example fixtures, so review should focus on semantic equivalence, not just textual changes.

## Related Items

- **Depends on**: `docs/todos/372-make-push-local-equivalent-to-localget.md`
- **Related**: `docs/todos/272-add-float-width-type-guarding-to-localset.md`

## Notes

- Breaking APIs are expected here; the compiler has not been released yet, so a clean source language is preferable to compatibility scaffolding.
