---
title: 'TODO: Migrate editor directive consumers to centralized parsed directives'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Completed
completed: 2026-03-17
---

# TODO: Migrate editor directive consumers to centralized parsed directives

## Problem Description

The editor-state now has a centralized parsed-directive pass that stores `parsedDirectives` on each `CodeBlockGraphicData`.

At the moment, runtime directives are the main consumer of that shared parsed data, but most editor-directive features still use older parsing paths such as:

- `parseDirectiveComment`
- `parseEditorDirectives`
- directive-specific comment scans or local regex matching

That leaves the architecture half-migrated:

- runtime directives use the centralized parse pass
- editor directives still do their own parsing in many places
- the same raw directive syntax is still being interpreted through multiple parser entrypoints

This weakens the main benefit of the centralization work and keeps duplicate parsing logic alive.

## Proposed Solution

Migrate editor-directive consumers to read from `codeBlock.parsedDirectives` instead of reparsing raw code block text.

This should stay a parsing-source migration, not a semantic rewrite:

- the centralized pass remains responsible only for extracting directive records
- each directive feature keeps owning its own meaning and argument interpretation
- source-editing helpers can continue to work on raw code where appropriate

Examples of what should move to the centralized parsed-directive path:

- directive registry / directive plugin application
- favorite/home/disabled/group derivation
- widget-producing directives such as `@plot`, `@scan`, `@slider`, `@button`, `@switch`, `@piano`
- metadata directives such as color config, `@tab`, `@hide`, `@offset`

## Anti-Patterns

- Do not redesign all directive semantics while migrating parser inputs.
- Do not force source-editing helpers to stop operating on raw code.
- Do not keep adding new editor-directive parsing entrypoints once `parsedDirectives` exists.
- Do not leave silent fallbacks that reparse raw code inside production directive resolvers unless there is a clear external API need.

## Implementation Plan

### Step 1: Audit current editor-directive parsing entrypoints
- Identify all editor-state features still parsing `; @...` directly from raw code.
- Group them into:
  - rendering/derived-state consumers
  - source-editing helpers
  - tests that should be updated to the new model

### Step 2: Migrate central directive consumers first
- Update the main editor-directive registry/plugin application path to consume `parsedDirectives`.
- Keep directive-specific data validation local to each directive feature.

### Step 3: Migrate simple metadata consumers
- Move favorites, home, disabled, group, and similar metadata features to the shared parsed records.
- Remove duplicated parser utilities where they become unused.

### Step 4: Migrate widget-producing directives
- Move plot/scan/slider/button/switch/piano and similar widget directives to consume parsed records.
- Ensure raw row mapping and widget placement remain unchanged.

### Step 5: Clean up redundant parser helpers
- Remove or thin-wrap older parser helpers once production consumers no longer need them.
- Keep one source of truth for directive syntax parsing.

## Validation Checkpoints

- `npx nx run @8f4e/editor-state:test`
- `npx nx run @8f4e/editor-state:typecheck`
- `rg -n "parseDirectiveComment|parseEditorDirectives|@\\w+.*match\\(|parsedDirectives" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Production editor-directive consumers use `codeBlock.parsedDirectives` as their parsing input.
- [ ] Older raw-code directive parsing entrypoints are reduced substantially or removed where no longer needed.
- [ ] Directive widget/layout behavior remains unchanged after the migration.
- [ ] Editor-directive parsing has one clear source of truth in production code.
- [ ] Source-editing helpers remain separate and continue to operate on raw code only where that is actually required.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/` - directive consumers and plugins
- `packages/editor/packages/editor-state/src/features/code-blocks/features/favorites/` - favorite metadata derivation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/` - directive-driven rendering flow
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/` - older directive parser utilities
- `packages/editor/docs/editor-directives.md` - contributor-facing expectations if the implementation structure changes

## Risks & Considerations

- **Incremental migration risk**: mixed old/new parsing paths can persist longer than intended unless there is a clear cleanup phase.
- **Behavior drift**: directive-specific validation must remain local so migration does not accidentally broaden accepted syntax.
- **Scope creep**: this should stay focused on consumption of parsed records, not become a general directive architecture rewrite.

## Related Items

- **Depends on**: `docs/todos/313-add-centralized-parsed-directive-pass-to-code-block-derivation.md`
- **Related**: `docs/todos/300-extract-directive-editing-into-shared-feature.md`
- **Related**: `docs/todos/299-move-favorite-directive-under-central-directive-system.md`
- **Related**: `docs/todos/298-move-group-directive-under-central-directive-system.md`

## Notes

- Estimated effort assumes an incremental migration that reuses the existing directive feature structure rather than replacing it wholesale.
- The main value is architectural consistency: one parse pass, feature-owned resolution.
