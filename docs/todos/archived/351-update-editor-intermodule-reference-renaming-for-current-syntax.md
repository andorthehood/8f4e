---
title: 'TODO: Update editor intermodule reference renaming for current syntax'
priority: Medium
effort: 2-4h
created: 2026-03-30
status: Completed
completed: 2026-03-31
---

# TODO: Update editor intermodule reference renaming for current syntax

## Problem Description

The editor paste/rename flow still rewrites obsolete intermodule source syntax that is no longer part of the current language shape.

Current behavior:
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/renameInterModuleReferences.ts` still rewrites metadata-operator forms like `$module.memory` and `%module.memory`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.ts` still documents those obsolete forms
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.test.ts` still tests the old dotted metadata syntax

Why this is a problem:
- the editor rename logic is out of sync with the actual compiler/tokenizer syntax
- obsolete rewrite patterns make the paste flow harder to reason about
- tests and comments preserve a language shape that should no longer exist

## Proposed Solution

Update editor intermodule-reference renaming to track the current source syntax only.

High-level approach:
- remove obsolete dotted metadata-operator rewrites
- add or keep rename support for the current source forms that should still be updated when module ids change
- align comments and tests with the actual current tokenizer/compiler syntax

## Anti-Patterns

- Do not preserve obsolete `$module.memory`, `%module.memory`, `^module.memory`, or `!module.memory` rewrite logic just for backward compatibility.
- Do not broaden this into a full parser refactor.
- Do not add generic regex handling for unsupported legacy forms.
- Do not change runtime/editor resolved memory-id plumbing; this is source-code rename cleanup only.

## Implementation Plan

### Step 1: Audit the current source forms
- Confirm which intermodule source-level forms are still valid in tokenizer/compiler today.
- Use that as the exact rewrite surface for the editor helper.

### Step 2: Update the rename helper
- Refactor `packages/editor/packages/editor-state/src/features/code-blocks/utils/renameInterModuleReferences.ts` to rewrite only the supported current forms.
- Remove obsolete dotted metadata-operator regexes.

### Step 3: Align paste flow comments and tests
- Update `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.ts` comments to describe only current syntax.
- Rewrite `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.test.ts` to cover current forms and stop asserting obsolete ones.

## Validation Checkpoints

- `sed -n '1,220p' packages/editor/packages/editor-state/src/features/code-blocks/utils/renameInterModuleReferences.ts`
- `sed -n '1,120p' packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.ts`
- `sed -n '1,160p' packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.test.ts`
- `npx nx run editor-state:test --skipNxCache -- packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.test.ts`

## Success Criteria

- [ ] Editor rename logic no longer rewrites obsolete dotted metadata-operator forms.
- [ ] Paste/rename logic covers the currently supported intermodule source syntax only.
- [ ] Comments and tests no longer describe obsolete source syntax.
- [ ] Focused editor-state tests pass.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/utils/renameInterModuleReferences.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/pasteMultipleBlocks.test.ts`

## Risks & Considerations

- **Syntax drift**: the implementation should be based on the current tokenizer/compiler syntax, not on stale comments or old tests.
- **Overreach**: this should stay a targeted editor rename cleanup, not a wider parser redesign.
- **Breaking changes**: acceptable here; obsolete syntax should not be preserved if it is no longer supported.

## Related Items

- **Related**: `docs/todos/archived/326-unify-remaining-editor-runtime-memory-ids-to-colon-syntax.md`

## Notes

- This is specifically about editor source-code rewriting during paste/rename flows.
- Runtime/editor memory-id plumbing is already on `module:memory`; the stale part is the obsolete source-syntax rewrite logic.
