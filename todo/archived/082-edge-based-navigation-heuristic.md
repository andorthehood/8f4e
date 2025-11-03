---
title: 'TODO: Implement Edge-Based Code Block Navigation'
priority: Medium
effort: 1-2d
created: 2025-02-14
status: Completed
completed: 2025-02-14
---

# TODO: Implement Edge-Based Code Block Navigation

## Problem Description

- `findClosestCodeBlockInDirection` currently compares block centers, so diagonally closer blocks can win even when a block is directly in the requested direction.
- This causes confusing jumps, especially when moving vertically through staggered layouts.
- Navigation should prefer blocks that line up on the traversal axis, improving predictability and UX.

## Proposed Solution

- High-level approach: replace center-to-center comparisons with edge-to-edge measurements so primary axis alignment dominates.
- Key changes:
  - Switch distance calculations to nearest edges (bottom-to-top for `down`, left-to-right for `right`, etc.).
  - Preserve a strong alignment bias so perpendicular offsets only break ties, with configurable tolerance for future tuning.
  - Update Vitest coverage to lock in the new behavior, especially for diagonal and staggered fixtures.
- Alternative approaches considered: stricter directional cones, overlap thresholds, and tuned alignment weights (see `todo/brainstorming_notes/007-code-block-navigation-heuristics.md`).

## Implementation Plan

### Step 1: Define edge distance helpers
- Specific task: add reusable utilities that compute primary and secondary distances using block edges.
- Expected outcome: consistent edge-based measurements that factor offsets and dimensions.
- Dependencies: existing `CodeBlockPosition` structure and helper conventions.

### Step 2: Update `findClosestCodeBlockInDirection`
- Specific task: swap the center-based scoring for calls to the new edge helpers.
- Expected outcome: directional moves prioritize edge-aligned targets, keeping API surface identical.
- Dependencies: Step 1 utilities implemented and exported where needed.

### Step 3: Expand test coverage
- Specific task: add diagonal/staggered fixtures and assertions for all four directions.
- Expected outcome: tests confirm intuitive navigation and guard against regressions on aligned grids.
- Dependencies: updated heuristic from Step 2.

## Success Criteria

- [x] Edge distance calculations replace center-based logic in helper functions.
- [x] Updated tests confirm predictable navigation in diagonal/staggered layouts.
- [x] Existing navigation scenarios continue passing without regressions.

## Affected Components

- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.ts` - Updated heuristic implementation.
- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.test.ts` - New and updated fixtures.

## Risks & Considerations

- **Risk**: Overly strict alignment filtering might trap navigation when no block perfectly aligns; mitigate with tolerance fallback.
- **Risk**: Changes could impact other consumers relying on old behavior; review usage in `codeBlockNavigation`.
- **Dependencies**: None beyond existing editor-state helpers and tests.
- **Breaking Changes**: Behavior change is intentional; communicate in release notes if navigation feels different.

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: `todo/brainstorming_notes/007-code-block-navigation-heuristics.md`

## References

- [MDN: Spatial navigation heuristics](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Navigation#spatial_navigation)

## Notes

- Consider instrumenting navigation telemetry to observe real-world behavior before finalizing constants.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to reflect the change by moving the entry to the "Completed TODOs" section with the completion date.
