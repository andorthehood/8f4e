---
title: 'TODO: Implement CSS-Like Viewport Animation for Code Block Navigation'
priority: Medium
effort: 4-6 hours
created: 2025-11-03
status: Completed
completed: 2025-11-03
---

# TODO: Implement CSS-Like Viewport Animation for Code Block Navigation

## Problem Description

Currently, when navigating between code blocks using Command+Arrow keys, the viewport instantly snaps to the new position. This creates a jarring experience and makes it difficult for users to maintain spatial awareness of where code blocks are located relative to each other.

**Current state:**
- `codeBlockNavigation` effect directly calls `centerViewportOnCodeBlock()` which immediately mutates viewport coordinates
- No visual transition between viewport positions
- User can lose track of navigation direction

**Impact:**
- Less polished UX
- Harder to build mental map of code block layout
- Navigation feels abrupt and disorienting

## Proposed Solution

Implement a CSS transition-like animation system in the `web-ui` package (Option 4 from brainstorming notes). This approach:

1. Keeps `editor-state` completely unaware of animations (maximum separation of concerns)
2. `web-ui` detects viewport coordinate changes and automatically animates transitions
3. Animations are controlled by a feature flag in `editor-state`
4. Animation logic is isolated in the rendering layer where it belongs

**Key principle:** Just like CSS transitions, you set the destination (`viewport.x = 100`) and the rendering system handles the animated journey. The business logic layer remains simple and declarative.

**Feature flag usage pattern:**
- Enable the flag right before calling `centerViewportOnCodeBlock()` in navigation
- Disable the flag when user starts dragging the viewport manually
- This ensures animations only apply to programmatic viewport changes, not manual dragging

## Implementation Plan

### Step 1: Add Feature Flag
- Add `viewportAnimations: boolean` to `FeatureFlags` interface in `packages/editor/packages/editor-state/src/types.ts`
- Default to `false` for disabled animations
- Will be enabled temporarily in `codeBlockNavigation` effect right before `centerViewportOnCodeBlock()` call
- Will be disabled in `viewport` effect when user starts dragging

**Expected outcome:** Feature flag exists and controls when animations are active

### Step 2: Create Animation State in Web-UI
- In `packages/editor/packages/web-ui/src/index.ts`, add local animation state (not part of editor-state):
  ```typescript
  let animationState: {
    isAnimating: boolean;
    startViewport: { x: number; y: number };
    targetViewport: { x: number; y: number };
    startTime: number;
    duration: number;
  } | null = null;
  
  let previousViewport = { x: ..., y: ... };
  ```
- Add easing function (e.g., `easeInOutCubic`)

**Expected outcome:** Local state structure ready to track animations

### Step 3: Implement Change Detection
- Create `calculateEffectiveViewport()` function that:
  - Compares current `state.graphicHelper.activeViewport.viewport` with `previousViewport`
  - If different, starts new animation
  - If animation active, calculates interpolated position
  - Returns effective viewport for rendering

**Expected outcome:** Function correctly detects changes and initiates animations

### Step 4: Update Code Block Navigation Effect
- In `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts`:
  - Enable feature flag before calling `centerViewportOnCodeBlock()`:
    ```typescript
    if (targetBlock !== currentBlock) {
      state.graphicHelper.selectedCodeBlock = targetBlock;
      state.featureFlags.viewportAnimations = true; // Enable animation
      centerViewportOnCodeBlock(
        state.graphicHelper.activeViewport.viewport,
        targetBlock,
        state.graphicHelper.globalViewport
      );
    }
    ```
  
**Expected outcome:** Navigation triggers animations via feature flag

### Step 5: Update Viewport Effect to Disable Animation on Drag
- In `packages/editor/packages/editor-state/src/effects/viewport.ts`:
  - In the `onMouseMove` handler, disable animation flag when user drags:
    ```typescript
    function onMouseMove(event: MouseMoveEvent) {
      if (event.buttons === 1 && state.featureFlags.viewportDragging) {
        state.featureFlags.viewportAnimations = false; // Disable animation on drag
        move(state, event.movementX, event.movementY);
      }
    }
    ```

**Expected outcome:** Manual viewport dragging cancels and prevents animations

### Step 6: Integrate with Render Loop
- In `engine.render()` callback:
  - Call `calculateEffectiveViewport()` to get animated position
  - Temporarily override `state.graphicHelper.activeViewport.viewport` with effective viewport
  - Execute all drawing operations
  - Restore original viewport after rendering
- This keeps all drawers unchanged (they use viewport from state)

**Expected outcome:** Smooth animations when viewport changes, no changes needed to drawer functions

### Step 7: Handle Animation Completion
- When animation completes in `calculateEffectiveViewport()`:
  - Set `state.featureFlags.viewportAnimations = false`
  - This prevents future viewport changes from animating until explicitly enabled again
  
**Expected outcome:** Animation flag automatically resets after completion

### Step 8: Handle Edge Cases
- User dragging viewport during animation: Cancel animation and follow drag
- Multiple rapid navigation commands: Each starts new animation from current animated position
- Animation disabled via feature flag: Skip animation logic entirely
- Ensure animations don't interfere with manual viewport dragging effect

**Expected outcome:** Robust handling of user interactions and edge cases

### Step 9: Test and Tune
- Test Command+Arrow navigation feels smooth
- Verify manual dragging still works correctly
- Test toggling feature flag on/off
- Tune animation duration (start with 300ms, adjust based on feel)
- Try different easing functions if needed

**Expected outcome:** Polished, smooth animations that enhance UX

## Success Criteria

- [ ] Viewport smoothly animates when navigating between code blocks with Command+Arrow
- [ ] Feature flag is enabled in `codeBlockNavigation` before `centerViewportOnCodeBlock()` call
- [ ] Feature flag is disabled when user starts dragging viewport
- [ ] Feature flag is disabled when animation completes
- [ ] Manual viewport dragging does not trigger animations
- [ ] Manual viewport dragging cancels any active animation
- [ ] Animation duration feels natural (not too fast or slow)
- [ ] No changes required to `editor-state` package beyond feature flag
- [ ] No changes required to existing drawer functions
- [ ] Animation automatically cancels when user drags viewport
- [ ] Animation flag automatically resets after completion
- [ ] Multiple rapid navigations chain smoothly
- [ ] Performance is good (60fps maintained)

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Add feature flag
- `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts` - Enable flag before centering viewport
- `packages/editor/packages/editor-state/src/effects/viewport.ts` - Disable flag on drag start
- `packages/editor/packages/web-ui/src/index.ts` - Main implementation of animation logic
- No changes to drawer functions in `packages/editor/packages/web-ui/src/drawers/`

## Risks & Considerations

- **Performance**: Need to ensure frame-by-frame interpolation doesn't impact 60fps target
  - Mitigation: Keep calculations minimal, profile if needed
- **State Consistency**: Temporarily overriding viewport during render could cause issues
  - Mitigation: Always restore original viewport after drawing, or use a separate render-only viewport
- **Animation Interruption**: Need clean handling when user drags during animation
  - Mitigation: Cancel animation immediately on drag start
- **Testing Complexity**: Animation logic is harder to unit test in rendering context
  - Mitigation: Consider extracting interpolation logic to pure functions that can be tested separately

## Related Items

- **Brainstorming**: `todo/brainstorming_notes/081-viewport-animation-easing-approaches.md` - Full analysis of all options
- **Related Feature**: Code block navigation (`packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts`)
- **Depends on**: Existing `centerViewportOnCodeBlock` helper (already implemented)

## References

- [Brainstorming Document](todo/brainstorming_notes/081-viewport-animation-easing-approaches.md) - Detailed comparison of implementation approaches
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Easing Functions Cheat Sheet](https://easings.net/)
- [CSS Transitions Philosophy](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)

## Notes

### Design Decision: Why Option 4 (CSS-like)

Option 4 was chosen over Option 3 (Hybrid) because:
1. **Better separation**: `editor-state` remains completely unaware of animations
2. **Simpler API**: Just set viewport coordinates, animation happens automatically
3. **Philosophical fit**: Animations are a presentation concern, not business logic
4. **Familiar pattern**: Mirrors CSS transitions (declarative destination, imperative journey)

### Implementation Philosophy

The key insight is that animations are a **rendering concern**, not a business logic concern. The business logic should care about "the viewport should be centered on this block" - not *how* it gets there. This is a presentation detail that belongs in the rendering layer, just like CSS transitions.

**Feature flag as animation trigger:** The `viewportAnimations` flag acts as a signal from `editor-state` to `web-ui` that says "the next viewport change should be animated." This is similar to temporarily adding a CSS `transition` class to an element before changing its properties. The flag is:
- Enabled in `codeBlockNavigation` right before programmatic viewport changes
- Disabled in `viewport` effect when user starts manual dragging
- Disabled by `web-ui` after animation completes

This ensures animations only apply to intentional navigation commands, not manual interactions or other viewport changes.

### Animation Parameters to Consider

- **Duration**: Start with 300ms, tune based on feel (200-400ms typical range)
- **Easing**: `easeInOutCubic` provides smooth start and end, but consider:
  - `easeOutQuad` for snappy navigation
  - `easeInOutQuad` for balanced feel
  - Custom easing for specific effect
- **Feature Flag**: Consider making duration and easing configurable via settings in future

### Future Enhancements

- Make animation duration configurable in settings
- Allow different easing functions per user preference
- Apply same pattern to other viewport changes (e.g., click to focus)
- Add animation for zoom level changes if implemented

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry
