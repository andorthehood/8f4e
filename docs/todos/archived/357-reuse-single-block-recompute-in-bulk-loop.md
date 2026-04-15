---
title: 'TODO: Reuse single-block recompute in bulk viewport-anchored loop'
priority: Low
effort: 30 minutes
created: 2026-04-02
status: Completed
completed: 2026-04-15
---

# TODO: Reuse single-block recompute in bulk viewport-anchored loop

## Problem Description

In `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/viewport/effect.ts`, `recomputeViewportAnchoredPositions` (bulk) and `recomputeViewportAnchoredPosition` (single) duplicate the same call to `resolveViewportAnchoredPosition`. The bulk function should simply iterate and delegate to the single-block function.

Current state:
```ts
function recomputeViewportAnchoredPositions(state) {
    for (const block of state.graphicHelper.viewportAnchoredCodeBlocks) {
        if (block === state.graphicHelper.draggedCodeBlock) continue;
        const pos = resolveViewportAnchoredPosition({ ... }); // duplicated
        block.x = pos.x; block.y = pos.y;
    }
}
```

Any future change to the single-block logic must be applied in two places.

## Proposed Solution

Make the bulk function delegate to the single-block function:

```ts
function recomputeViewportAnchoredPositions(state) {
    for (const block of state.graphicHelper.viewportAnchoredCodeBlocks) {
        recomputeViewportAnchoredPosition(state, block);
    }
}
```

The dragged-block guard already lives inside `recomputeViewportAnchoredPosition`, so it is preserved automatically.

## Implementation Plan

### Step 1: Update recomputeViewportAnchoredPositions
- Replace the inline loop body with a call to `recomputeViewportAnchoredPosition(state, block)`
- Remove the now-redundant `draggedCodeBlock` guard from the bulk function

## Success Criteria

- [ ] `recomputeViewportAnchoredPositions` contains no direct call to `resolveViewportAnchoredPosition`
- [ ] Existing viewport-anchored tests still pass

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/viewport/effect.ts`
