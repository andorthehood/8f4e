# Brainstorming: Viewport Animation Easing for Code Block Navigation

**Date**: 2025-11-03  
**Context**: Adding smooth easing animations when navigating between code blocks with Command+Arrow keys

## Problem Statement

Currently, `codeBlockNavigation` instantly snaps the viewport to center on the target code block. We want to add smooth easing animations for better UX. The challenge is deciding where to implement this animation logic given our architecture:

- **editor-state package**: State management and business logic (read/write)
- **web-ui package**: Pure rendering layer with `requestAnimationFrame` loop (should be read-only)

## Considered Approaches

### Option 1: State-based with `setInterval`

Keep viewport animation logic entirely in `editor-state`, updating viewport coordinates with `setInterval` or similar timer.

**Pros:**
- ✅ Keeps state mutations in `editor-state`
- ✅ Clean separation of concerns

**Cons:**
- ❌ Not synchronized with rendering (will cause jank)
- ❌ Less efficient (separate timer loop)
- ❌ `setInterval` timing is imprecise
- ❌ May appear laggy or stuttery

### Option 2: Render-loop based

Implement animation in the `web-ui` render loop using `requestAnimationFrame`.

**Pros:**
- ✅ Synchronized with `requestAnimationFrame`
- ✅ Smooth 60fps animations
- ✅ Efficient (no extra timers)

**Cons:**
- ❌ Violates read-only rendering principle
- ❌ State mutations in presentation layer
- ❌ Breaks architectural boundaries

### Option 3: Hybrid Approach with Animation State

Introduce explicit animation state that bridges both layers while maintaining clean separation.

**Pros:**
- ✅ State mutations stay in `editor-state`
- ✅ Rendering stays read-only (only calculates ephemeral interpolated values)
- ✅ Synchronized with `requestAnimationFrame`
- ✅ Efficient (no extra timers)
- ✅ Testable (animation logic can be unit tested separately)
- ✅ Flexible (easy to add different easing functions, durations, or cancel animations)
- ✅ Clean separation (animation state is explicit and separate from viewport state)

**Cons:**
- ⚠️ More complex API (need to set up animation state explicitly)
- ⚠️ More code in both layers (animation state + interpolation + completion handlers)
- ⚠️ Requires event communication between layers (animation-complete events)
- ⚠️ Animation state lives in `editor-state` but is only consumed by `web-ui`
- ⚠️ More verbose state mutations (can't just set viewport.x/y)
- ⚠️ Animation becomes part of the business logic layer (philosophical concern)

### Option 4: Web-UI Reactive Animation State (CSS Transition Pattern)

Let `web-ui` maintain its own local animation state and automatically animate whenever it detects viewport coordinate changes in `editor-state`. The state would include a feature flag to enable/disable this behavior.

**This mirrors how CSS transitions work**: You set `left: 100px` in CSS, and if transitions are enabled, the browser automatically animates from the old value to the new one. You're just setting the destination; the animation system handles the journey transparently.

**Pros:**
- ✅ `editor-state` remains completely unaware of animations (ultimate separation)
- ✅ Synchronized with `requestAnimationFrame`
- ✅ Simple state mutations in `editor-state` (just set viewport.x/y directly)
- ✅ Animation complexity isolated in rendering layer
- ✅ No event handlers needed between layers
- ✅ Easy to disable (just toggle feature flag)
- ✅ Familiar mental model (CSS transitions/animations)
- ✅ Animation state is private implementation detail (not exposed to editor-state)

**Cons:**
- ⚠️ Web-UI needs to track previous viewport state to detect changes
- ⚠️ Still technically read-only (stores local animation state, not editor state)
- ⚠️ Edge cases: Multiple rapid changes need queuing or cancellation logic
- ⚠️ Testing animation logic requires rendering context
- ⚠️ Less explicit - animations happen "magically" on state changes
- ⚠️ Cannot inspect or control animation mid-flight from editor-state (by design)