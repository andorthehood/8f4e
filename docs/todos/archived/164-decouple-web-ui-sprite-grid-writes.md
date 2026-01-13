---
title: 'TODO: Decouple Web-UI Sprite/Grid Writes'
priority: Medium
effort: 1-2d
created: 2026-01-08
status: Completed
completed: 2026-01-8
---

# TODO: Decouple Web-UI Sprite/Grid Writes

## Problem Description

`@8f4e/web-ui` currently writes `state.graphicHelper.spriteLookups`, `state.graphicHelper.viewport.hGrid`, and
`state.graphicHelper.viewport.vGrid` as part of its initialization and sprite reload logic. This makes the rendering
layer responsible for mutating shared state, which complicates separation of concerns and future refactors that want
web-ui to be read-only with respect to core editor state.

## Proposed Solution

Move ownership of sprite generation outputs and grid sizing into the editor package. The editor should generate
`spriteLookups` and update `hGrid`/`vGrid`, then pass those values into web-ui so it can render without mutating state.

## Implementation Plan

### Step 1: Move sprite/grid state writes into the editor
- Move sprite generation and state writes for `spriteLookups`, `hGrid`, and `vGrid` into editor initialization.
- Ensure web-ui receives the generated sprite sheet and lookups as inputs (or via a new init option).

### Step 2: Update web-ui init and reload flow
- Remove direct writes to `state.graphicHelper.spriteLookups`, `state.graphicHelper.viewport.hGrid`, and
  `state.graphicHelper.viewport.vGrid` inside `@8f4e/web-ui`.
- Update `reloadSpriteSheet` so it relies on editor-provided updates instead of mutating state itself.

### Step 3: Validate editor state consistency
- Verify that grid sizes update correctly on font changes or color scheme reloads.
- Confirm existing render features still rely on `state.graphicHelper.spriteLookups` without behavioral regressions.

## Success Criteria

- [ ] Web-ui no longer writes to `state.graphicHelper.spriteLookups`, `state.graphicHelper.viewport.hGrid`, or
  `state.graphicHelper.viewport.vGrid`.
- [ ] Editor owns sprite generation and grid sizing updates.
- [ ] Rendering output and sprite sheet reloads remain consistent.

## Affected Components

- `packages/editor/packages/web-ui/src/index.ts` - Remove state writes and adjust init signature.
- `packages/editor/src/index.ts` - Generate sprite lookups and update grid sizes before calling web-ui init.
- `packages/editor/packages/web-ui/README.md` - Update usage documentation to reflect new init inputs.

## Related Items

- `docs/brainstorming_notes/020-web-ui-state-dependencies.md`

## Notes

- This task is a follow-up to the state dependency audit for web-ui.
