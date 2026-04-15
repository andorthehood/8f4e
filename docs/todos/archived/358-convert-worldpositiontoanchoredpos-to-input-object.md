---
title: 'TODO: Convert worldPositionToAnchoredPos to use an input object'
priority: Low
effort: 1 hour
created: 2026-04-02
status: Completed
completed: 2026-04-15
---

# TODO: Convert worldPositionToAnchoredPos to use an input object

## Problem Description

`worldPositionToAnchoredPos` in `resolve.ts` accepts 11 positional parameters, while its counterpart `resolveViewportAnchoredPosition` uses a typed input object. The inconsistency makes call sites hard to read and positional arguments easy to accidentally swap.

Current signature:
```ts
export function worldPositionToAnchoredPos(
    anchor, worldX, worldY, viewportX, viewportY,
    viewportWidth, viewportHeight, blockWidth, blockHeight, vGrid, hGrid
)
```

## Proposed Solution

Replace the positional parameters with a typed input object. Since the two functions share almost all fields, the same `ViewportAnchoredPositionInput` interface can be extended or reused, with `worldX`/`worldY` substituting `posX`/`posY`.

```ts
export interface WorldToAnchoredPosInput {
    anchor: ViewportAnchor;
    worldX: number;
    worldY: number;
    viewportX: number;
    viewportY: number;
    viewportWidth: number;
    viewportHeight: number;
    blockWidth: number;
    blockHeight: number;
    vGrid: number;
    hGrid: number;
}

export function worldPositionToAnchoredPos(input: WorldToAnchoredPosInput): { gridX: number; gridY: number }
```

## Implementation Plan

### Step 1: Define the input interface
- Add `WorldToAnchoredPosInput` to `resolve.ts` (or reuse/extend `ViewportAnchoredPositionInput`)

### Step 2: Update the function signature and body
- Destructure from the input object instead of positional args

### Step 3: Update all call sites
- `codeBlockDragger/effect.ts` — the only current caller

### Step 4: Update inline tests in resolve.ts

## Success Criteria

- [ ] `worldPositionToAnchoredPos` takes a single input object
- [ ] All call sites updated
- [ ] All existing tests pass

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/viewport/resolve.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`
