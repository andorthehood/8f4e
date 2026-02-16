---
title: 'TODO: Add Free-Space Finder for Editor Config Block Placement'
priority: Medium
effort: 4-8h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add Free-Space Finder for Editor Config Block Placement

## Problem Description

Editor config blocks are loaded from local storage and appended to the runtime code-block list. Their saved coordinates can collide with project code blocks loaded from the project file, causing overlap and making both blocks harder to read and interact with.

Currently there is no dedicated placement utility that finds a guaranteed free coordinate for editor config blocks when a collision would occur.

## Proposed Solution

Add a placement helper that:
- scans code-block space starting at grid coordinate `0,0`
- scans downward (increasing Y) row-by-row
- returns the first free top-left grid coordinate where the target block does not overlap any existing block
- evaluates occupancy using each block's effective grid bounds (position + width + height)

Use this helper when appending editor config blocks loaded from local storage so placement is deterministic and non-overlapping.

## Implementation Plan

### Step 1: Add occupancy model for code-block bounds
- Define a shared way to compute a block's occupied rectangle in grid space.
- Include width and height in grid units (not only top-left coordinate).
- Ensure offsets and runtime-calculated dimensions are handled consistently.

### Step 2: Implement free-space scan helper
- Add a pure helper that accepts existing block bounds and target block size.
- Start from `0,0`, scan downward for the first non-overlapping position.
- Return grid coordinates suitable for assigning `gridX/gridY`.

### Step 3: Integrate during editor-config block loading
- In the editor-config load path, detect overlap with project blocks.
- Use the helper to re-place colliding editor config blocks.
- Preserve explicit stored coordinates when they are already free.

## Success Criteria

- [ ] A helper exists that scans from `0,0` downward and returns the first free coordinate.
- [ ] The helper checks overlap using block width and height, not just top-left points.
- [ ] Editor config blocks loaded from local storage no longer overlap project blocks by default.
- [ ] Placement behavior is deterministic across reloads.
- [ ] Unit tests cover collision and non-collision placement cases.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` - editor config block load/placement path
- `packages/editor/packages/editor-state/src/features/code-blocks` - placement/bounds helper location
- `packages/editor/packages/editor-state/src/features/editor-config` - integration touchpoints for loaded config blocks

## Risks & Considerations

- **Dimension timing risk**: Width/height may be computed after initial construction; helper should use reliable dimensions or derive temporary bounds safely.
- **Performance risk**: Naive downward scans can become expensive with many blocks; keep the algorithm simple but bounded and test with dense layouts.
- **Coordinate consistency**: Mixing pixel and grid coordinates can cause off-by-one overlap checks; keep occupancy checks fully grid-based.

## Related Items

- **Related**: `docs/todos/124-code-block-grid-coordinates.md`
- **Related**: `docs/todos/197-editor-config-blocks.md` (archived)
