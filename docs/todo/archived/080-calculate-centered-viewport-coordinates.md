---
title: 'TODO: Calculate Centered Viewport Coordinates for Code Block'
priority: Medium
effort: 3-4 hours
created: 2025-11-02
status: Completed
completed: 2025-11-02
---

# TODO: Calculate Centered Viewport Coordinates for Code Block

## Problem Description

The editor currently lacks a utility function to calculate the optimal viewport coordinates needed to center a given code block on screen. When implementing features like "jump to code block" or "focus on selected block," there's no systematic way to determine what viewport position would center a specific code block while respecting viewport boundaries.

Current state:
- Viewport can be moved via `move()` mutator in `mutators/viewport.ts`
- Code blocks have absolute coordinates (`x`, `y`) and dimensions (`width`, `height`)
- Global viewport tracks dimensions (`width`, `height`, `center`)
- No helper exists to calculate centering coordinates

What's needed:
- A function that takes a code block and returns viewport coordinates that would center it
- The centering must ensure the **top of the code block never goes offscreen**
- If the code block is taller than the viewport, only the bottom should be clipped
- The function should be reusable for various navigation and focus features

## Proposed Solution

Add a new helper function `centerViewportOnCodeBlock()` to the `editor-state` package that:

1. Takes as input:
   - A reference to the viewport object to mutate (`Viewport`)
   - The code block to center on (`CodeBlockGraphicData`)
   - The global viewport dimensions (for calculating center point)

2. Returns:
   - `void` (mutates the viewport object directly)

3. Implements centering logic:
   - Horizontally: Center the block `viewport.x = blockCenter.x - viewportCenter.x`
   - Vertically: Center the block, but clamp to ensure top edge is visible
   - Account for code block offsets (`offsetX`, `offsetY`)
   - Respect viewport boundaries and grid snapping if needed

4. Handles constraints:
   - Top edge constraint: `viewport.y ≤ block.y + block.offsetY`
   - Large block handling: Allow bottom to extend beyond viewport
   - Boundary cases: Very small or very large code blocks

## Implementation Plan

### Step 1: Create the Helper Function File
- Create `packages/editor/packages/editor-state/src/helpers/centerViewportOnCodeBlock.ts`
- Define the function signature:
  ```typescript
  function centerViewportOnCodeBlock(
    viewport: Viewport,
    codeBlock: CodeBlockGraphicData,
    globalViewport: { width: number; height: number }
  ): void
  ```
- Add JSDoc documentation explaining the centering behavior and constraints
- Export the function

**Expected outcome**: New file with function skeleton and types

### Step 2: Implement Horizontal Centering
- Calculate the code block's center point:
  ```typescript
  const blockCenterX = codeBlock.x + codeBlock.offsetX + (codeBlock.width / 2);
  ```
- Calculate and set viewport X to center the block:
  ```typescript
  viewport.x = blockCenterX - (globalViewport.width / 2);
  ```
- Consider edge cases:
  - Blocks near the left edge (don't center if it would show negative space)
  - Very wide blocks (center on the block's content)

**Expected outcome**: Horizontal centering works correctly, viewport.x is mutated

### Step 3: Implement Vertical Centering with Top Constraint
- Calculate the ideal centered viewport Y:
  ```typescript
  const blockCenterY = codeBlock.y + codeBlock.offsetY + (codeBlock.height / 2);
  const idealViewportY = blockCenterY - (globalViewport.height / 2);
  ```
- Apply the top constraint (ensure block top is never offscreen):
  ```typescript
  const blockTop = codeBlock.y + codeBlock.offsetY;
  viewport.y = Math.max(blockTop, idealViewportY);
  ```
- This ensures:
  - Small blocks are centered when possible
  - Large blocks show their top edge (bottom may be clipped)
  - Top edge is always visible

**Expected outcome**: Vertical centering respects the top-visibility constraint, viewport.y is mutated

### Step 4: Add Optional Padding/Margin
- Add optional padding parameter to keep blocks away from viewport edges:
  ```typescript
  const VIEWPORT_PADDING = 20; // pixels from edge
  ```
- Adjust calculations to include padding:
  ```typescript
  viewport.y = Math.max(
    blockTop - VIEWPORT_PADDING,
    idealViewportY
  );
  ```
- Make padding configurable or use a reasonable default

**Expected outcome**: Blocks have comfortable spacing from viewport edges

### Step 5: Add Comprehensive Unit Tests
- Create `packages/editor/packages/editor-state/src/helpers/centerViewportOnCodeBlock.test.ts`
- Test scenarios:
  - **Small block centered**: Block smaller than viewport, should be perfectly centered
  - **Large block top aligned**: Block taller than viewport, top should be visible
  - **Block at viewport edge**: Block near boundaries, handle gracefully
  - **Block with offsets**: Account for `offsetX` and `offsetY`
  - **Various viewport sizes**: Different screen dimensions
  - **Edge cases**: Zero-sized blocks, negative coordinates
  - **Mutation verification**: Verify viewport object is mutated correctly
- Create mock `Viewport` objects and verify x/y values after mutation
- Verify viewport coordinates are correct

**Expected outcome**: 100% test coverage with all scenarios validated

### Step 6: Export from Package Index
- Add export to `packages/editor/packages/editor-state/src/helpers/index.ts` (create if needed)
- Or add to main `packages/editor/packages/editor-state/src/index.ts` export list
- Ensure the function is part of the public API

**Expected outcome**: Function accessible to package consumers

### Step 7: Create Integration Example
- Document usage in JSDoc with example:
  ```typescript
  // Example: Focus on a code block
  centerViewportOnCodeBlock(
    state.graphicHelper.activeViewport.viewport,
    selectedCodeBlock,
    state.graphicHelper.globalViewport
  );
  // viewport.x and viewport.y are now updated
  ```
- Consider creating an effect or event handler that uses this function
- Could integrate with directional navigation (jump to block and center it)

**Expected outcome**: Clear usage examples for developers

## Success Criteria

- [ ] Function correctly mutates viewport coordinates to center code blocks
- [ ] Top edge of code block is never positioned offscreen
- [ ] Large code blocks (taller than viewport) show their top portion
- [ ] Small code blocks are properly centered both horizontally and vertically
- [ ] Code block offsets (`offsetX`, `offsetY`) are correctly accounted for
- [ ] Unit tests achieve 100% code coverage and verify mutation behavior
- [ ] Function is exported and accessible from the package
- [ ] Documentation includes clear examples and constraint explanations
- [ ] Performance is acceptable (O(1) calculation time)
- [ ] Function signature clearly communicates mutation behavior

## Affected Components

- `packages/editor/packages/editor-state/src/helpers/` - New helper function added
- `packages/editor/packages/editor-state/src/helpers/centerViewportOnCodeBlock.ts` - New file
- `packages/editor/packages/editor-state/src/helpers/centerViewportOnCodeBlock.test.ts` - New test file
- `packages/editor/packages/editor-state/src/index.ts` - Export statement added
- `packages/editor/packages/editor-state/src/types.ts` - Uses existing `Viewport` type

## Algorithm Design Details

### Centering Calculation

The function mutates the viewport using the following algorithm:

```typescript
// 1. Calculate block center (absolute coordinates)
const blockCenterX = codeBlock.x + codeBlock.offsetX + (codeBlock.width / 2);
const blockCenterY = codeBlock.y + codeBlock.offsetY + (codeBlock.height / 2);

// 2. Calculate viewport center
const viewportCenterX = globalViewport.width / 2;
const viewportCenterY = globalViewport.height / 2;

// 3. Calculate ideal viewport position (block center aligns with viewport center)
const idealViewportX = blockCenterX - viewportCenterX;
const idealViewportY = blockCenterY - viewportCenterY;

// 4. Apply constraints
const blockTop = codeBlock.y + codeBlock.offsetY;

// Top constraint: viewport Y cannot be greater than block top
// This ensures the top of the block is always visible
const constrainedViewportY = Math.max(blockTop, idealViewportY);

// Optional: Add padding/margin
const PADDING = 20;
const finalViewportY = Math.max(blockTop - PADDING, constrainedViewportY);

// 5. Mutate viewport object
viewport.x = idealViewportX;
viewport.y = finalViewportY;
```

### Visual Representation

```
Scenario 1: Small Block (fits in viewport)
┌─────────────────────────────┐
│         Viewport            │
│                             │
│      ┌───────────┐          │
│      │   Block   │          │  ← Block is centered
│      └───────────┘          │
│                             │
└─────────────────────────────┘

Scenario 2: Large Block (taller than viewport)
┌─────────────────────────────┐
│         Viewport            │
│      ┌───────────┐          │
│      │   Block   │          │  ← Top is visible
│      │           │          │
│      │           │          │
│      │ (content) │          │
│      │           │
│      │ continues │
│      │  below)   │
└─────────────────────────────┘
       │           │
       └───────────┘  ← Bottom may be offscreen
```

### Constraint Rationale

The "top never goes offscreen" constraint ensures:
1. **Usability**: Users can always see where a code block starts (the module declaration)
2. **Context**: The beginning of code provides essential context (module name, initial code)
3. **Natural behavior**: Reading code naturally starts from the top
4. **Consistency**: Predictable behavior when focusing on different sized blocks

## Risks & Considerations

- **Mutation semantics**: Function mutates the viewport parameter. This must be clearly documented to avoid confusion. The function name `centerViewportOnCodeBlock` implies an action/mutation.
- **Grid snapping**: The function sets pixel coordinates. Calling code should handle grid snapping if needed (e.g., via `snapToGrid` mutator).
- **Animation**: This function only mutates coordinates. Smooth transitions would need to be implemented separately. Consider future animation support.
- **Nested viewports**: Code blocks can contain nested code blocks with their own viewports. This function works with any viewport reference passed to it.
- **Coordinate system**: Uses absolute coordinates (pixels) consistent with code block positioning. Viewport values may need conversion based on grid units.
- **Performance**: O(1) calculation, no performance concerns even with frequent calls.
- **Thread safety**: Not applicable in single-threaded JavaScript, but consider if this ever runs in worker contexts.

## Related Items

- **Blocks**: None (this is a foundational utility)
- **Depends on**: 
  - Existing `Viewport` type in `types.ts`
  - Existing `CodeBlockGraphicData` type
  - Current viewport mutators in `mutators/viewport.ts`
- **Related**: 
  - `075-code-block-directional-navigation.md` - Could use this function to center blocks after navigation
  - `062-editor-command-queue-refactor.md` - "Focus on block" command could use this
  - Existing viewport effect: `packages/editor/packages/editor-state/src/effects/viewport.ts`
  - Viewport mutators: `packages/editor/packages/editor-state/src/mutators/viewport.ts`

## References

- [Editor state package structure](/home/andormade/8f4e/packages/editor/packages/editor-state/)
- Viewport effect: `packages/editor/packages/editor-state/src/effects/viewport.ts`
- Viewport mutators: `packages/editor/packages/editor-state/src/mutators/viewport.ts`
- Type definitions: `packages/editor/packages/editor-state/src/types.ts` (lines 84, 259, 267-282)
- Code block positioning: How `x`, `y`, `offsetX`, `offsetY` work together

## Notes

### Design Decisions

- **Mutation-based**: Directly modifies the viewport object for efficiency and simplicity
- **Minimal parameters**: Only requires viewport, code block, and global dimensions
- **Pixel coordinates**: Works with pixel-based viewport coordinates for precision
- **Top-priority constraint**: Always prefer showing the top over perfect centering
- **Flexible padding**: Can be adjusted for different use cases
- **No animation**: Focuses on calculation only, animation is separate concern

### Implementation Notes

- The function mutates the viewport object directly (pass by reference)
- Viewport coordinates use pixels, not grid units (grid conversion happens elsewhere)
- Code block positions include both base position and dynamic offsets
- Negative viewport coordinates are allowed (viewport can pan to any position)
- The function is simple and efficient, suitable for repeated calls

### Future Enhancements (Out of Scope)

- Animated transitions to centered position
- Smart centering based on code block content (e.g., center on cursor position)
- Multi-block centering (center view on multiple selected blocks)
- Zoom-aware centering (account for zoom levels)
- Configurable centering strategies (top-align, bottom-align, custom offsets)
- "Focus area" parameter to center on specific region within block

### Integration Points

This function can be used by:
1. **Keyboard navigation**: Center block when navigating with arrow keys
2. **Search/jump**: Center block when jumping to search results
3. **Context menu**: "Focus on this block" action
4. **Debugging**: Center block when encountering errors
5. **Tutorial/onboarding**: Guide users to specific blocks
6. **Undo/redo**: Return to previously centered blocks

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry
