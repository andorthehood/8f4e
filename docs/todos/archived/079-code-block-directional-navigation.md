---
title: 'TODO: Add Directional Navigation Function for Code Blocks'
priority: Medium
effort: 4-6 hours
created: 2025-11-02
status: Completed
completed: 2025-11-02
---

# TODO: Add Directional Navigation Function for Code Blocks

## Problem Description

The editor currently lacks a systematic way to navigate between code blocks using directional input (up, down, left, right). While users can click on code blocks to select them, there's no programmatic function to determine which code block is "closest" in a given direction from the currently selected code block. This functionality would be essential for:

- Keyboard-based navigation between code blocks
- Improving accessibility
- Enabling potential gamepad/controller support
- Providing a foundation for spatial navigation features

Currently, the editor has:
- `findCodeBlockAtViewportCoordinates()` to find a code block at specific x/y coordinates
- Code block selection via mouse clicks
- Arrow key navigation within code blocks (text cursor movement)

What's missing is a function that can spatially analyze the relationship between code blocks and determine the "next" code block in a given direction.

## Proposed Solution

Add a new helper function `findClosestCodeBlockInDirection()` to the `editor-state` package that:

1. Takes as input:
   - The list of code blocks (typically `Set<CodeBlockGraphicData>`)
   - The currently selected code block (`CodeBlockGraphicData`)
   - The direction (`'left' | 'right' | 'up' | 'down'`)

2. Returns:
   - The reference to the closest code block in the specified direction
   - The same selected code block if no other blocks exist in that direction (maintains stability)

3. Uses a spatial algorithm that:
   - Filters code blocks based on directional criteria
   - Calculates distance using a weighted formula that prioritizes alignment
   - Handles edge cases (no blocks in direction, overlapping blocks, etc.)

The function will be a pure helper that can be used by effects/event handlers for navigation features.

## Implementation Plan

### Step 1: Create the Helper Function File
- Create `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.ts`
- Define the function signature with proper TypeScript types
- Add JSDoc documentation explaining the algorithm and parameters
- Export the function

**Expected outcome**: New file with function skeleton and types

### Step 2: Implement the Core Algorithm
- Define the directional filtering logic:
  - **Left**: `candidateBlock.x < selectedBlock.x`
  - **Right**: `candidateBlock.x > selectedBlock.x`
  - **Up**: `candidateBlock.y < selectedBlock.y`
  - **Down**: `candidateBlock.y > selectedBlock.y`
- Implement distance calculation:
  - Primary distance: distance along the direction axis (e.g., horizontal for left/right)
  - Secondary distance: perpendicular distance (for prioritizing aligned blocks)
  - Weight formula: `primaryDistance + (secondaryDistance * alignmentWeight)`
- Handle viewport offsets (`offsetX`, `offsetY`)
- Return the selected block if no candidates found

**Expected outcome**: Working algorithm that correctly identifies the closest block

### Step 3: Add Comprehensive Unit Tests
- Create `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.test.ts`
- Test scenarios:
  - **Single direction**: Multiple blocks in one direction, should pick closest
  - **Alignment preference**: Aligned blocks should be preferred over misaligned ones
  - **No blocks in direction**: Should return selected block
  - **Only selected block exists**: Should return selected block
  - **Overlapping positions**: Should handle blocks at same coordinates
  - **All four directions**: Test up, down, left, right independently
  - **Edge cases**: Empty set, blocks with offsets, viewport considerations
- Use mock `CodeBlockGraphicData` objects with various positions

**Expected outcome**: 100% test coverage with all edge cases validated

### Step 4: Export from Package Index
- Add export to `packages/editor/packages/editor-state/src/helpers/index.ts` (create if doesn't exist)
- Or add to main `packages/editor/packages/editor-state/src/index.ts` export list
- Ensure the function is part of the public API

**Expected outcome**: Function accessible to package consumers

### Step 5: Create Example Usage Documentation
- Add a code example in the function's JSDoc
- Document integration points where this could be used:
  - Keyboard event handlers (Ctrl+Arrow keys for block navigation)
  - Context menu actions
  - Command palette commands
- Note any coordinate system considerations (viewport vs. absolute positioning)

**Expected outcome**: Clear documentation for future developers

### Step 6: Optional - Integration Example
- Consider adding a simple keyboard shortcut handler as a proof-of-concept
- Could add to `graphicHelper.ts` keyboard event handler
- Use modifier keys (e.g., Ctrl+Arrow) to distinguish from text cursor movement
- Update selected code block based on navigation

**Expected outcome**: Working demo of the navigation feature

## Success Criteria

- [ ] Function correctly identifies the closest code block in all four directions
- [ ] Returns the selected block when no other blocks exist in the direction
- [ ] Handles edge cases gracefully (empty sets, single block, overlapping positions)
- [ ] Unit tests achieve 100% code coverage with all scenarios validated
- [ ] Function is exported from the package and accessible
- [ ] Documentation clearly explains the algorithm and usage
- [ ] TypeScript types are properly defined and prevent misuse
- [ ] Performance is acceptable for large code block sets (O(n) complexity)

## Affected Components

- `packages/editor/packages/editor-state/src/helpers/` - New helper function added
- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.ts` - New file
- `packages/editor/packages/editor-state/src/helpers/findClosestCodeBlockInDirection.test.ts` - New test file
- `packages/editor/packages/editor-state/src/index.ts` - Export statement added
- `packages/editor/packages/editor-state/src/types.ts` - Possibly new type definitions for direction enum

## Algorithm Design Details

### Distance Calculation Strategy

For a given direction, the algorithm should:

1. **Filter candidates**: Only consider blocks that are actually in the specified direction
   ```typescript
   // Example for 'right' direction
   const candidates = Array.from(codeBlocks).filter(block => 
     block !== selectedBlock && 
     block.x + block.offsetX > selectedBlock.x + selectedBlock.offsetX
   );
   ```

2. **Calculate weighted distance**: 
   ```typescript
   // Primary: distance in the direction of movement
   // Secondary: distance perpendicular (for alignment)
   const primaryDistance = Math.abs(candidateBlock.x - selectedBlock.x);
   const secondaryDistance = Math.abs(candidateBlock.y - selectedBlock.y);
   const score = primaryDistance + (secondaryDistance * ALIGNMENT_WEIGHT);
   ```
   
   Where `ALIGNMENT_WEIGHT` could be 0.5 or 1.0 to balance between "closest" and "most aligned"

3. **Consider block dimensions**: Use center points or edges depending on desired behavior
   - Center-to-center distance
   - Or edge-to-edge distance
   - Account for `width` and `height` for more accurate spatial awareness

4. **Handle viewport**: Decide whether to use absolute coordinates or viewport-relative coordinates

### Edge Cases to Handle

1. **No candidates found**: Return `selectedBlock`
2. **Equal distances**: Return the first found (deterministic behavior)
3. **Nested code blocks**: Filter to only current viewport's code blocks
4. **Closed vs. open blocks**: Consider `isOpen` state if relevant
5. **Blocks at infinity**: Validate coordinates are within reasonable bounds

## Risks & Considerations

- **Performance**: With many code blocks, O(n) linear search per navigation action. Should be acceptable for typical project sizes (<1000 blocks). Consider spatial indexing if needed.
- **Coordinate systems**: Need to decide between viewport-relative and absolute coordinates. Recommend using absolute with offsets for consistency.
- **Alignment preference**: The weighting factor for alignment vs. distance needs empirical tuning. Start with 1.0 and adjust based on user feedback.
- **Viewport boundaries**: Should the function consider only visible blocks or all blocks? Recommend all blocks for consistency.
- **Breaking changes**: This is a new function, so no breaking changes expected.

## Related Items

- **Blocks**: None (this is a foundational feature)
- **Depends on**: None (uses existing types and structures)
- **Related**: 
  - `026-separate-editor-user-interactions.md` - Could utilize this for navigation features
  - `062-editor-command-queue-refactor.md` - Navigation commands could be integrated here
  - Existing helper `findCodeBlockAtViewportCoordinates.ts` - Similar spatial logic

## References

- [Spatial navigation algorithms](https://www.w3.org/TR/css-nav-1/) - W3C spatial navigation spec
- [Editor state package structure](/home/andormade/8f4e/packages/editor/packages/editor-state/)
- Existing helper: `packages/editor/packages/editor-state/src/helpers/findCodeBlockAtViewportCoordinates.ts`
- Text cursor navigation: `packages/editor/packages/editor-state/src/helpers/editor.ts` (moveCaret function)

## Notes

### Design Decisions

- **Pure function**: Should be stateless and side-effect free
- **Defensive**: Return selected block rather than `null`/`undefined` when no candidates
- **Testable**: Use dependency injection for any external dependencies
- **Coordinate system**: Use absolute coordinates (x, y) with offsets (offsetX, offsetY) as seen in other helpers

### Implementation Notes

- The function should be similar in structure to `findCodeBlockAtViewportCoordinates` but with directional logic
- Consider creating a shared type for direction: `type Direction = 'left' | 'right' | 'up' | 'down';`
- The algorithm is inspired by spatial navigation used in TV/console UIs
- Can be extended in the future to support diagonal directions or more sophisticated navigation

### Future Enhancements (Out of Scope)

- Wrap-around navigation (from rightmost to leftmost)
- Group-aware navigation (navigate within nested code blocks first)
- Smart navigation based on visual layout rather than coordinates
- History-based navigation (remember last visited blocks)
- Jump to nearest unconnected block

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry
