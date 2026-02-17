---
title: 'TODO: Add Delete Group context-menu action (no confirmation)'
priority: Medium
effort: 4-8h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add Delete Group context-menu action (no confirmation)

## Problem Description

Group management now includes operations like ungroup/copy/skip, but there is no single action to remove all code blocks in a group. Deleting grouped blocks one by one is slow and error-prone.

## Proposed Solution

Add a context-menu action on grouped blocks:
- `Delete group`

Behavior:
- Visible only when selected block has `groupName`.
- Deletes all code blocks that share the selected block’s group name.
- Executes immediately without a confirmation dialog.

## Scope (MVP)

- Group-wide delete from context menu.
- Exact group-name match.
- No confirmation modal.
- Preserve existing undo/history behavior if enabled.

## Out Of Scope

- Confirmation prompts.
- Partial group delete.
- Soft-delete/archive behavior.

## Behavior Rules

Visibility:
- Show `Delete group` only for grouped selected blocks.

Target set:
- All code blocks where `groupName` equals selected block `groupName`.

Execution:
- Delete all target blocks in one operation.
- Clear selected/dragged references if they point to deleted blocks.
- Ensure context menu state is reset/closed after action.

## Implementation Plan

### Step 1: Add menu item
- Add `Delete group` to relevant block context menu.
- Wire to dedicated event (for example `deleteGroup`).

### Step 2: Implement group delete handler
- Resolve selected block and group name.
- Filter out all blocks in matching group from `graphicHelper.codeBlocks`.
- Update related state pointers (`selectedCodeBlock`, `draggedCodeBlock`, programmatic selection) when removed.

### Step 3: Ensure history/undo integration
- Confirm action is captured as a single undoable operation where history is enabled.
- Avoid per-block incremental state writes.

### Step 4: Add tests
- Menu visibility test for grouped vs ungrouped blocks.
- Effect tests:
  - deletes all matching group blocks
  - leaves non-matching groups untouched
  - works with mixed block types in a group
  - clears selection state correctly
  - no-op safety when selected block/group missing

### Step 5: Update docs
- Add short note about `Delete group` behavior and lack of confirmation.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"Delete group|deleteGroup|groupName\" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Grouped blocks expose `Delete group` action.
- [ ] Action deletes all blocks in selected group in one operation.
- [ ] No confirmation is shown.
- [ ] Non-group blocks are not affected.
- [ ] Tests cover visibility, deletion scope, and state cleanup.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant menu builder)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (group delete handler)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/docs/editor-directives.md` (or context menu docs)

## Risks & Considerations

- **Accidental destructive action**: no confirmation is intentional; undo behavior must be reliable.
- **State cleanup gaps**: stale selected/dragged references can cause follow-up errors if not cleared.
- **Large groups**: ensure delete path remains efficient.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/223-add-ungroup-all-with-same-group-name-context-menu-action.md`
- **Related**: `docs/todos/234-add-copy-group-and-multi-block-clipboard-paste.md`

## Notes

- Product requirement: delete must execute immediately without confirmation UI.
