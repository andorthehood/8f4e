---
title: 'TODO: Consolidate module and arrow drawing loops'
priority: Medium
effort: 0.5 days
created: 2025-10-31
status: Completed
completed: 2025-11-04
---

# TODO: Consolidate module and arrow drawing loops

## Problem Description

The web UI maintains separate rendering passes for visible code blocks (`drawers/codeBlocks/index.ts`) and the off-screen arrow indicators (`drawers/arrows.ts`). Both iterate the entire `activeViewport.codeBlocks` set with nearly identical visibility checks, duplicating logic and doing unnecessary work each frame. This makes optimizing or adjusting visibility computations error-prone and adds overhead when the module count grows.

## Proposed Solution

Refactor the rendering flow so a single pass handles both visible modules and off-screen arrows. Extract a shared visibility helper that reports whether a module intersects the viewport and, if not, returns the arrow placement data currently calculated in `arrows.ts`. Replace the dedicated arrows drawer with a utility invoked from the unified loop. An earlier idea to maintain a separate cache of visible code blocks is unnecessary because arrows still require iterating the full set.

## Implementation Plan

### Step 1: Derive shared visibility helper

Pull the viewport intersection and arrow intersection math into a reusable function (likely co-located with the code-block drawer). The helper should take a `CodeBlockGraphicData` plus viewport metrics and return `{ isVisible, arrowPlacement }`.

### Step 2: Merge rendering loops

Update `drawers/codeBlocks/index.ts` to iterate every module once, using the helper to either render the full module (current logic) or draw the corresponding arrow via the existing engine calls. Remove the redundant loop from `drawers/arrows.ts` and adjust imports accordingly.

### Step 3: Validate rendering behaviour

Run the editor locally (`npm run dev`) to confirm visible modules render normally and off-screen modules still produce the correct directional arrows. Exercise viewport dragging to ensure the helper keeps both cases in sync.

## Success Criteria

- [ ] Code blocks render correctly with a single iteration path
- [ ] Off-screen arrow indicators appear as before
- [ ] Manual viewport drag test passes without console errors

## Affected Components

- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` - consolidate visibility and rendering logic
- `packages/editor/packages/web-ui/src/drawers/arrows.ts` - remove redundant loop or convert to utility
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connections.ts` - sanity-check compatibility with refactored visibility helper

## Risks & Considerations

- **Risk 1**: Misplacing the arrow calculations could regress arrow positioning; mitigate by basing the helper strictly on existing `arrows.ts` math.
- **Risk 2**: Shared helper may introduce unintended dependencies between drawers; keep scope minimal and document usage.
- **Dependencies**: Requires understanding of `Engine` drawing API and viewport metrics.
- **Breaking Changes**: None expected if behaviour parity is maintained.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
