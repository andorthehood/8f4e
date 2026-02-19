---
title: 'TODO: Add "Go @home" main menu action'
priority: Medium
effort: 2-4h
created: 2026-02-19
status: Complete
completed: 2026-02-19
---

# TODO: Add "Go @home" main menu action

## Problem Description

The editor supports `; @home` as the source for startup viewport placement, but there is no explicit menu action to return to that location during navigation.

## Requested Behavior

- Add a new main context-menu item labeled exactly: `Go @home`.
- Place it directly above `Jump to...` in the main menu.
- Behavior when clicked:
  - Find first code block marked as home (same first-match rule as project load).
  - Center viewport on that home code block.
  - If no home block exists, center viewport to `(0,0)`.
- Home lookup rule should ignore disabled status; only home designation matters.
- Use existing viewport animation behavior, consistent with current jump/navigation actions.

## Scope

- UI/menu wiring only; no change to directive syntax.
- Keep existing Jump-to favorites behavior unchanged.
- Reuse existing viewport-centering helpers and event patterns where possible.

## Implementation Plan

### Step 1: Menu item insertion
- Update main menu generation to include `Go @home` immediately before `Jump to...`.
- Keep item visible even when no home block exists.

### Step 2: Event/action wiring
- Add menu action handler for `Go @home`.
- Resolve first home block from current runtime code blocks.
- Center viewport on that block using existing centering flow.
- If none found, set/center viewport at `(0,0)`.

### Step 3: Animation behavior alignment
- Ensure the action follows existing jump centering animation behavior (`viewportAnimations`).
- Avoid introducing a separate animation path.

### Step 4: Tests
- Add/update tests for:
  - menu includes `Go @home` above `Jump to...`
  - single home block centers correctly
  - multiple home blocks picks first
  - no home block falls back to `(0,0)`
  - disabled home block still used
  - animation flag behavior remains consistent with other jump actions

### Step 5: Documentation
- Update menu/navigation docs if present to mention `Go @home`.
- Keep directive docs as source for `@home` semantics and reference menu action there if needed.

## Decision Record

- Label: `Go @home`
- Placement: above `Jump to...`
- Missing home fallback: `(0,0)`
- Multi-home behavior: first match wins (same as load)
- Selection criteria: only home flag/directive, not disabled state
- Animation: same as existing jump/centering behavior

## Success Criteria

- [ ] Main menu shows `Go @home` directly above `Jump to...`.
- [ ] `Go @home` centers first home block when present.
- [ ] `Go @home` centers to `(0,0)` when no home block exists.
- [ ] Behavior matches load rule for multi-home projects.
- [ ] Existing `Jump to...` behavior remains unchanged.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/mainMenu.ts`
- `packages/editor/packages/editor-state/src/features/menu/effect.ts`
- `packages/editor/packages/editor-state/src/features/viewport/*` (reused helpers)
- Related menu/navigation tests in editor-state
- Optional docs under `packages/editor/docs/*`

## Notes

- This TODO captures agreed behavior only; implementation is intentionally deferred.
