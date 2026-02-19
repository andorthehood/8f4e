---
title: 'TODO: Add "Clear debug probes" context-menu action'
priority: Medium
effort: 2-4h
created: 2026-02-18
status: Complete
completed: 2026-02-19
---

# TODO: Add "Clear debug probes" context-menu action

## Problem Description

Code blocks can contain editor-only debug directives (`; @debug ...`), but there is no dedicated context-menu action to clear them quickly from a selected block.

## Agreed Behavior

- Add a context-menu item labeled: `Clear debug probes`.
- Show it always (not conditionally hidden).
- Keep it enabled even when the selected block has no debug directives.
- Scope: selected block only.
- Placement: near module-specific actions (around Skip/Unskip actions).
- Effect: remove all `; @debug ...` lines from the selected block.
- Do not remove any other directive lines (`; @group`, `; @favorite`, etc.).

## Implementation Plan

### Step 1: Menu wiring
- Add `Clear debug probes` item to the block context menu.
- Keep item visible and enabled regardless of current block content.
- Place it near module-specific actions.

### Step 2: Action handler
- Add a dedicated event/effect handler for clearing debug directives on the selected block.
- Remove only `; @debug` directives from that block.
- Treat missing debug directives as a no-op.

### Step 3: Tests
- Add/extend tests for:
  - menu item presence in module context menu
  - removal of one/multiple `; @debug` lines
  - no-op when there are no debug directives
  - preserving other directive lines

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "Clear debug probes|@debug" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `Clear debug probes` appears in the context menu for selected code blocks.
- [ ] Action is always enabled.
- [ ] Action removes all `; @debug` lines from selected block only.
- [ ] Non-debug directives remain unchanged.
- [ ] Tests cover behavior and no-op path.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (new clear-debug handler)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.test.ts`

## Notes

- This TODO records agreed product behavior only. Implementation is intentionally deferred.
