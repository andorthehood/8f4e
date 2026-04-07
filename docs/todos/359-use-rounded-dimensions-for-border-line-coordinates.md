---
title: 'TODO: Audit borderLineCoordinates use of raw vs rounded viewport dimensions'
priority: Low
effort: 1-2 hours
created: 2026-04-02
status: Completed
completed: 2026-04-07
---

# TODO: Audit borderLineCoordinates use of raw vs rounded viewport dimensions

## Problem Description

`calculateBorderLineCoordinates` computes the viewport edge lines (used by the offscreen arrow indicators) from raw `viewport.width` / `viewport.height`. Meanwhile, all viewport-anchored block positioning now uses `viewport.roundedWidth` / `viewport.roundedHeight` — the dimensions floored to the nearest grid unit.

This creates an inconsistency: the boundary that arrows point toward is up to `vGrid-1` / `hGrid-1` pixels wider/taller than the boundary that anchored blocks are positioned against. Whether this matters depends on whether arrows are expected to align with the grid-snapped edges or the true pixel edges.

## Proposed Solution

Audit the arrow placement code to determine the correct behaviour:

- If arrows should point to the visible pixel edge of the viewport (true for UI arrows that track actual screen bounds), keep raw dimensions — the current behaviour is correct.
- If arrows should align with the grid-snapped boundary used for block positioning (more consistent with the coordinate system), switch `calculateBorderLineCoordinates` to use `roundedWidth` / `roundedHeight`.

Document the decision either way with a comment in `calculateBorderLineCoordinates`.

## Implementation Plan

### Step 1: Trace arrow placement logic
- Read `arrowPlacement.ts` and `calculateBorderLineCoordinates.ts` together
- Determine whether arrows must align with pixel edges or grid edges

### Step 2: Apply the appropriate fix or add explanatory comment
- If switching to rounded: update `calculateBorderLineCoordinates` to read `roundedWidth`/`roundedHeight`
- If keeping raw: add a comment explaining the intentional difference

### Step 3: Visual smoke-test
- Check that offscreen arrows still render at the correct viewport edge after any change

## Success Criteria

- [x] The choice of raw vs rounded dimensions in `calculateBorderLineCoordinates` is deliberate and documented
- [x] Arrow placement is visually correct at non-grid-aligned viewport sizes

## Affected Components

- `packages/editor/packages/editor-state/src/features/viewport/calculateBorderLineCoordinates.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/arrowPlacement.ts`
