---
title: 'TODO: Migrate project disabled flag to ; @disabled editor directive'
priority: Medium
effort: 1-2d
created: 2026-02-18
status: Complete
completed: 2026-02-18
---

# TODO: Migrate project disabled flag to ; @disabled editor directive

## Problem Description

The project structure currently stores a `disabled` field on code blocks. This duplicates intent that can live directly in code via editor directives and makes project JSON less source-of-truth oriented.

## Requested Behavior

- Replace project-level `disabled` persistence with a code directive: `; @disabled`.
- Keep `graphicHelper.codeBlocks[].disabled` in editor-state as a derived/runtime field used by compiler filtering.
- Keep context-menu UX unchanged (`Disable <blockLabel>` / `Enable <blockLabel>`).
- Directive should be block-type agnostic.
- Do not enforce canonical directive placement.
- Legacy project import compatibility is not required (breaking change allowed).
- Keep existing non-project `disabled` usage where currently needed (for example clipboard/internal flows), unless changed separately.

## Scope

- Breaking API change is allowed in one commit across affected packages.
- Remove `disabled` from project structure as the persisted source for project import/export.
- Treat `; @disabled` as the persisted source and derive runtime boolean state from code lines.

## Implementation Plan

### Step 1: Directive parser + derivation
- Add parser utility for `; @disabled` in editor-state directive helpers.
- Derive `codeBlock.disabled` from code when blocks are created/loaded/updated.

### Step 2: Toggle behavior migration
- Update disable/enable context-menu effect to insert/remove `; @disabled` instead of toggling persisted project field directly.
- Preserve menu labels and event names.

### Step 3: Project structure migration
- Remove `disabled` from project block serialization/deserialization contracts.
- Update project export/import paths to persist disabled state only through code directives.
- Drop legacy fallback handling for project `disabled`.

### Step 4: Compiler/filtering integrity
- Keep all compiler/config/shader filtering paths based on `graphicHelper.codeBlocks[].disabled`.
- Ensure those booleans are always refreshed from directive-derived state.

### Step 5: Tests + docs
- Update/add tests for parser, menu toggle behavior, project import/export shape, and compiler filtering outcomes.
- Update editor directive docs to include `; @disabled`.

## Success Criteria

- [ ] Project JSON no longer includes block-level `disabled`.
- [ ] Adding/removing `; @disabled` changes runtime `codeBlock.disabled`.
- [ ] Context-menu disable/enable works without behavior regressions.
- [ ] Compiler-related filtering behavior remains unchanged.
- [ ] No legacy project `disabled` compatibility path remains.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/**`
- `packages/editor/packages/editor-state/src/features/project-export/**`
- `packages/editor/packages/editor-state/src/features/project-import/**`
- `packages/editor/docs/editor-directives.md`
- `packages/cli/src/**` (project-shape alignment)

## Notes

- This TODO captures requested direction and constraints; implementation is intentionally deferred.
