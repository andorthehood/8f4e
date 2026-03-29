---
title: 'TODO: Add viewport-anchored code block directive'
priority: Medium
effort: 4-8h
created: 2026-03-29
status: Open
completed: null
---

# TODO: Add viewport-anchored code block directive

## Problem Description

The editor currently supports only world-space code block positioning through `; @pos <gridX> <gridY>`.

That works well for ordinary project layout, but it does not support blocks that should stay attached to the viewport itself, such as HUD-style controls, always-visible status blocks, or helper panels that should remain pinned to a viewport corner while the user pans around the project.

A naive viewport-locking feature is risky because:

- it could introduce a second competing coordinate system alongside `@pos`
- it could let users accidentally place blocks outside the visible viewport
- it could make dragging and manual coordinate editing inconsistent or confusing

## Proposed Solution

Add a new editor-only directive:

```txt
; @viewport <top-left|top-right|bottom-left|bottom-right>
```

This directive does not replace `@pos`. Instead:

- `@pos` remains the only persisted coordinate source of truth for block placement
- `@viewport` changes how `@pos` is interpreted
- when `@viewport` is absent, `@pos` keeps its current meaning as world-space grid coordinates
- when `@viewport` is present, `@pos` is interpreted as an offset from the specified viewport corner

Example:

```txt
module hud
; @viewport top-right
; @pos 2 1
output out 1
moduleEnd
```

In this example the block is anchored to the viewport's top-right corner and placed two grid cells inward from the right edge and one grid cell downward from the top edge.

### Offset Semantics

To keep the mental model consistent, positive `@pos` values should always move inward from the anchored edges:

- `top-left`: `+x` moves right, `+y` moves down
- `top-right`: `+x` moves left, `+y` moves down
- `bottom-left`: `+x` moves right, `+y` moves up
- `bottom-right`: `+x` moves left, `+y` moves up

This keeps `; @pos 0 0` meaning "flush against the anchored corner" for all four anchor modes.

### Clamping Behavior

Viewport-anchored blocks must never become unreachable because of large or negative offsets.

When `@viewport` is present:

- derive the requested pixel position from the active viewport corner plus `@pos`
- clamp the final block rectangle so it remains visible inside the viewport
- if the block is larger than the viewport, clamp the anchored corner and allow overflow only on the opposite side

This means oversized or out-of-range `@pos` values do not invalidate the directive and do not fall back to world-space placement. The block stays visible, and the user can adjust `@pos` manually afterward if the clamp changed the exact requested placement.

### Dragging Behavior

Dragging should continue to work for viewport-anchored blocks.

- the block should move visually within the viewport while dragged
- on drag end, the editor should rewrite `@pos` in the anchored coordinate system
- `@viewport` should remain unchanged

This preserves the rule that `@pos` stays the editable source of truth even for viewport-anchored blocks.

## Anti-Patterns

- Do not make `@viewport` replace or erase `@pos`.
- Do not introduce a second persisted offset directive for viewport anchoring.
- Do not silently fall back to world-space `@pos` when viewport-anchored coordinates are out of range.
- Do not allow viewport-anchored blocks to become permanently inaccessible outside the visible area.
- Do not special-case only one corner; all four corners should use one consistent model.

## Implementation Plan

### Step 1: Add directive parsing and anchor data
- Add a new viewport directive parser/data helper under the editor directive feature area.
- Accept exactly one anchor argument: `top-left`, `top-right`, `bottom-left`, or `bottom-right`.
- Treat missing, duplicate, or invalid `@viewport` directives as absent/invalid in a way that fails safely.
- Extend code block runtime data with a placement mode or resolved anchor field so the renderer can distinguish world-space blocks from viewport-anchored blocks.

### Step 2: Centralize coordinate resolution
- Extract placement resolution into a helper that can compute final pixel `x/y` from:
  - current viewport dimensions and origin
  - the block's `@pos`
  - the optional `@viewport` anchor
  - the block's measured width and height
- Keep the current world-space `@pos` behavior unchanged when `@viewport` is missing.
- For viewport-anchored blocks, interpret `@pos` as inward offset from the chosen corner and clamp the final position inside the visible viewport.

### Step 3: Apply the new placement model everywhere position is derived
- Use the new resolution path during initial project load.
- Use it when code edits change `@pos` or `@viewport`.
- Recompute anchored block positions on viewport resize and viewport movement.
- Recompute anchored positions when font/grid metrics change because the block's size and grid-to-pixel conversion may change.

### Step 4: Update dragging and hit-testing behavior
- Keep hit-testing based on final resolved pixel `x/y`.
- Update drag-end logic so viewport-anchored blocks write back anchored `@pos` coordinates instead of world-space coordinates.
- Preserve existing drag behavior for non-anchored blocks.
- Verify that group dragging behavior remains coherent if anchored and non-anchored blocks are mixed.

### Step 5: Add tests and documentation
- Add parser tests for valid and invalid `@viewport` forms.
- Add placement tests covering all four anchor modes.
- Add clamp tests for negative offsets, oversized positive offsets, and blocks larger than the viewport.
- Add drag tests confirming that dragging rewrites `@pos` in anchored coordinates.
- Document `@viewport` in the editor directives docs, including its relationship with `@pos`.

## Validation Checkpoints

- `npx nx run editor:test`
- `npx nx run editor:typecheck`
- `rg -n "@viewport|parsePos|gridX|gridY|codeBlockDragger|viewport" packages/editor/docs packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `; @viewport top-right` is recognized as a valid editor directive.
- [ ] `@pos` remains the only persisted coordinate source of truth for both ordinary and viewport-anchored blocks.
- [ ] A block with `@viewport` and `@pos` is positioned relative to the specified viewport corner.
- [ ] Positive `@pos` values move inward from the anchored edges for all four anchor modes.
- [ ] Viewport-anchored blocks are clamped so they remain visible inside the viewport.
- [ ] Dragging a viewport-anchored block updates `@pos` in the anchored coordinate system rather than rewriting it as world-space position.
- [ ] Ordinary blocks without `@viewport` keep current `@pos` behavior unchanged.
- [ ] The directive is documented in the editor directives docs.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/` - viewport directive parsing and validation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/` - placement resolution and recomputation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/` - anchored drag/writeback behavior
- `packages/editor/packages/editor-state/src/features/viewport/` - resize/move integration for anchored placement updates
- `packages/editor/docs/editor-directives.md` - directive documentation

## Risks & Considerations

- **Mixed placement modes**: code paths that assume `gridX/gridY` always describe world-space coordinates will need careful review.
- **Measurement dependency**: right/bottom anchoring and clamping depend on block width and height, so placement must happen after dimensions are known or be recomputed once known.
- **Viewport subscriptions**: anchored blocks must update when the viewport moves or resizes, not only when code changes.
- **Drag math**: converting dragged screen positions back into anchored `@pos` offsets is easy to get subtly wrong for right/bottom anchors.
- **Group behavior**: dragging mixed groups containing both world-space and viewport-anchored blocks may need a deliberate rule if current behavior becomes ambiguous.

## Related Items

- **Related**: `docs/todos/240-add-align-row-context-menu-action.md`
- **Related**: `docs/todos/297-add-url-editor-directive.md`
- **Related**: `docs/todos/302-add-jump-editor-directive.md`

## Notes

- This TODO captures the narrowed design decision: `@viewport` changes the anchor frame, but `@pos` remains the editable and persisted coordinate directive.
- Clamping is part of the intended behavior, not an error fallback.
