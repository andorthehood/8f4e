---
title: 'TODO: Persist Code Block Grid Coordinates'
priority: Medium
effort: 2-4h
created: 2025-12-15
status: Completed
completed: 2025-12-15
---

# TODO: Persist Code Block Grid Coordinates

## Problem Description

Code blocks currently store `x/y` in pixel space. When the editor font changes, the viewport grid cell sizes (`vGrid/hGrid`) change, but existing code blocks do not automatically reposition to the new pixel-space coordinates that correspond to their intended grid-aligned positions. This causes code blocks to appear offset/misaligned after font changes.

## Proposed Solution

Store grid-space position alongside pixel-space position:
- Add `gridX/gridY` back to `CodeBlockGraphicData` as the stable grid-aligned position (source of truth).
- Keep `x/y` in `CodeBlockGraphicData` as cached pixel-space values for runtime usage.
- Recompute `x/y` from `gridX/gridY` when:
  - A code block is dragged (drag end snap).
  - The font changes (viewport `vGrid/hGrid` changes).

## Implementation Plan

### Step 1: Add grid coordinates to state model
- Add `gridX` and `gridY` to `CodeBlockGraphicData`.
- Decide and document the invariant: `x = gridX * vGrid`, `y = gridY * hGrid` (plus any offsets if applicable).

### Step 2: Update code block creation/import
- When creating new code blocks, set `gridX/gridY` using the existing rounding mode against `vGrid/hGrid`, then set `x/y` from `gridX/gridY`.
- When importing a project, initialize `gridX/gridY` from `project.codeBlocks[].gridCoordinates` and set `x/y` from the current `vGrid/hGrid`.

### Step 3: Update dragging snap behavior
- On drag end, compute `gridX/gridY` using the existing rounding mode and viewport `vGrid/hGrid`.
- Recompute/snaps `x/y` from the new `gridX/gridY`.

### Step 4: Recompute on font/grid change
- When `viewport.vGrid/hGrid` are updated due to a font change, recompute every code block’s `x/y` from its `gridX/gridY`.

### Step 5: Update serialization and tests
- Update serialization to use `gridX/gridY` directly when writing `project.codeBlocks[].gridCoordinates`.
- Update test utilities/mocks and any snapshots impacted by the model changes.
- Run `nx` typecheck/tests for affected projects.

## Success Criteria

- [ ] Changing the font updates code block `x/y` consistently without changing their grid-aligned placement.
- [ ] Dragging a code block updates `gridX/gridY` and keeps `x/y` snapped to the grid.
- [ ] Project import/export preserves grid-aligned placement across font changes.
- [ ] Typecheck and tests pass for the affected packages.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - add `gridX/gridY` to `CodeBlockGraphicData`
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockDragger.ts` - update drag end snap to update `gridX/gridY` and recompute `x/y`
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` - initialize `gridX/gridY` on creation
- `packages/editor/packages/editor-state/src/effects/projectImport.ts` - initialize `gridX/gridY` on load
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeCodeBlocks.ts` - export grid coordinates from `gridX/gridY`
- `packages/editor/packages/web-ui/src/index.ts` - hook font reload (`vGrid/hGrid` changes) to recompute code block `x/y`

## Risks & Considerations

- **Rounding mode**: Must match existing grid snapping behavior (already used elsewhere); avoid introducing a new rounding rule.
- **Offsets/anchors**: Confirm whether `x/y` represent top-left or another anchor; ensure recompute logic matches existing rendering/interaction assumptions.
- **Breaking changes**: `CodeBlockGraphicData` type update may require touching all constructors and tests.

## Related Items

- **Related**: Font changes affecting layout (`packages/editor/packages/web-ui/src/index.ts`)

