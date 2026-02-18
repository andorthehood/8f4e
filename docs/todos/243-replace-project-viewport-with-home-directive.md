---
title: 'TODO: Replace project viewport with ; @home editor directive'
priority: Medium
effort: 1-2d
created: 2026-02-18
status: Open
completed: null
---

# TODO: Replace project viewport with ; @home editor directive

## Problem Description

The project JSON still persists `viewport` coordinates. That duplicates editor state in serialized project data and makes viewport initialization dependent on a separate project-level field instead of source code directives.

## Requested Behavior

- Add editor directive `; @home` to mark the code block that defines startup camera position.
- On project load, center viewport on the first code block containing `; @home`.
- If no code block contains `; @home`, default viewport to `(0,0)`.
- Remove `viewport` entirely from project structure (breaking API change is acceptable).
- Introduce runtime flag on code blocks: `graphicHelper.codeBlocks[].isHome` to simplify lookups.

## Scope

- Breaking change allowed across affected packages.
- No backward-compatibility shim required for legacy `project.viewport` payloads.
- Implementation should reuse existing centering helper for consistency.

## Implementation Plan

### Step 1: Project schema and type updates
- Remove `viewport` from `Project` in editor-state project import/export types.
- Update `EMPTY_DEFAULT_PROJECT` and any project creators (including pmml conversion output) to omit `viewport`.
- Update downstream type imports/usages that assume `project.viewport` exists.

### Step 2: Add `@home` parsing and runtime derivation
- Add directive parsing helper for `; @home` (strict: no arguments).
- Add `isHome` boolean to `CodeBlockGraphicData`.
- Set `isHome` during code-block population from `initialProjectState.codeBlocks`.
- Keep `isHome` synchronized on code edits (same update flow that currently reparses other directives like `@pos`).

### Step 3: Initial viewport placement from home block
- During project load path after code blocks are populated, find the first `isHome === true` in `graphicHelper.codeBlocks` (array order).
- If found, center viewport on that block via existing helper:
  - `centerViewportOnCodeBlock(...)`
- If not found, set viewport coordinates to `x=0`, `y=0`.

### Step 4: Remove viewport serialization
- Update `serializeToProject` and runtime-ready serialization paths to stop emitting `project.viewport`.
- Update project export tests/snapshots accordingly.

### Step 5: Tests and documentation
- Add/adjust tests for:
  - `@home` parse validity
  - first-`@home` wins when multiple are present
  - no-`@home` fallback to `(0,0)`
  - project import/export shape without `viewport`
  - `isHome` derivation and code-edit synchronization
- Update directive docs (`packages/editor/docs/editor-directives.md`) with `@home` syntax and behavior.

## Decision Record

- Multiple `@home` directives: first match wins (by `project.codeBlocks` order).
- API compatibility: not required (project schema change is intentional).
- Viewport centering implementation: must use existing center helper.
- Runtime convenience: keep `isHome` on `CodeBlockGraphicData` for fast lookup.

## Success Criteria

- [ ] `Project` type no longer contains `viewport`.
- [ ] Project exports no longer include `viewport` in JSON.
- [ ] On load, viewport centers on first `; @home` block when present.
- [ ] On load, viewport defaults to `(0,0)` when no `; @home` exists.
- [ ] `graphicHelper.codeBlocks[].isHome` exists and remains accurate after code edits.
- [ ] Tests and snapshots pass with the new project shape and behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/project-import/types.ts`
- `packages/editor/packages/editor-state/src/features/project-export/*`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/position/*` (new/updated parser)
- `packages/editor/docs/editor-directives.md`
- `packages/pmml28f4e/src/project.ts`
- Related tests/snapshots in editor-state and pmml package

## Notes

- This TODO captures agreed design only; implementation is intentionally deferred.
