---
title: 'TODO: Cursor-aware horizontal navigation'
priority: Medium
effort: 1 day
created: 2025-11-03
status: Open
completed: null
---

# TODO: Cursor-aware horizontal navigation

## Problem Description

- Directional navigation between code blocks currently only considers block geometry (edges and alignment) and ignores the cursor’s position inside the active block.
- When tall blocks sit beside multiple neighbors, users expect navigation to land on the neighbor closest to the cursor’s row; today the heuristic can jump to a distant block because it prioritizes alignment over cursor proximity.
- This breaks spatial intuition, especially in dense layouts, slowing editing and increasing navigation errors.

## Proposed Solution

- High-level approach: incorporate the selected block’s cursor Y coordinate into the left/right navigation scoring so we pick the neighbor vertically closest to the cursor.
- Key changes required: extend `CodeBlockPosition` in the navigation helper to surface cursor metadata, adjust scoring for horizontal movement to rank by cursor-to-candidate vertical distance before applying existing edge/alignment weights, and wire cursor data from the editor state through all call sites.

## Implementation Plan

### Step 1: Surface cursor metadata
- Update `CodeBlockPosition` and related helpers/tests to include cursor coordinates (at minimum absolute Y) from `CodeBlockGraphicData`.
- Expected outcome: navigation helper operates on enriched block data without type gaps.
- Dependencies or prerequisites: confirm `CodeBlockGraphicData.cursor.y` reflects viewport-aligned coordinates.

### Step 2: Rework horizontal scoring
- Modify `findClosestCodeBlockInDirection` to compute vertical distance between the cursor line and each horizontal neighbor, sort primarily by that value, then apply existing edge/alignment tie-breakers.
- Expected outcome: horizontal navigation targets the neighbor closest to the cursor while preserving left/right directional gating.
- Dependencies or prerequisites: Step 1 complete; retain existing up/down logic.

### Step 3: Expand automated coverage
- Add unit tests covering tall-block scenarios, multiple neighbors at varying heights, cursor near block edges, and regressions for up/down navigation.
- Expected outcome: tests fail under old behavior and pass once the new heuristic is in place, guarding against future regressions.
- Dependencies or prerequisites: Steps 1 and 2 complete to exercise cursor-aware logic.

### Step 4: Validate in editor
- Manually verify navigation with representative diagrams in the editor (tall blocks, sparse grids, diagonal offsets).
- Expected outcome: confirm behavior matches expectations and no unintended scroll/selection artifacts occur.
- Dependencies or prerequisites: Code changes merged locally; dev server running via `npm run dev`.

## Success Criteria

- [ ] Unit tests demonstrate cursor-aware selection when multiple horizontal neighbors exist.
- [ ] No regressions in vertical navigation or existing directional edge filtering (tests remain green).
- [ ] Manual verification confirms cursor-relative selection feels intuitive in real layouts.

## Affected Components

- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.ts` - Extend types and adjust scoring logic.
- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.test.ts` - Update mocks and add coverage.
- `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts` - Ensure it passes enriched block data if needed (likely interfaces only).

## Risks & Considerations

- **Risk 1**: Cursor Y might be viewport-relative; ensuring consistent coordinate systems is critical. Mitigation: audit rendering code to confirm offsets match navigation expectations.
- **Risk 2**: Overweighting cursor proximity could reduce alignment sensitivity for narrow blocks. Mitigation: tune weighting to balance cursor distance with existing edge/alignment heuristics.
- **Dependencies**: Requires accurate cursor state updates from `graphicHelper` effect.
- **Breaking Changes**: Type changes in `CodeBlockPosition` will break lean mocks/tests until updated (intended).

## Related Items

- **Blocks**: None.
- **Depends on**: None.
- **Related**: docs/brainstorming_notes/007-code-block-navigation-heuristics.md (existing navigation research).

## References

- [Navigation heuristic notes](docs/brainstorming_notes/007-code-block-navigation-heuristics.md)
- [findClosestCodeBlockInDirection tests](packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.test.ts)

## Notes

- Capture before/after behavior with screenshots or short clips if manual testing reveals edge cases.
- Coordinate with ongoing editor navigation work to avoid overlapping refactors.
- Update `docs/todo/_index.md` once implementation begins to reflect active priority.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
