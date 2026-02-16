---
title: 'TODO: Add group-wide ungroup context-menu action'
priority: Medium
effort: 1-2d
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add group-wide ungroup context-menu action

## Problem Description

After introducing `; @group <groupName>`, users can remove grouping from a single block, but there is no one-click action to remove the same group directive from all blocks in that group.

For large grouped layouts, removing the group block-by-block is slow and error-prone.

## Proposed Solution

Add a context-menu action on grouped blocks:
- `Ungroup "<groupName>"`

Behavior:
- Visible only when selected block has a valid `groupName`.
- On action, remove `; @group <groupName>` directives from all code blocks with that exact group name.
- Single atomic operation over the whole matching set.

## Scope (MVP)

- Group-wide removal by exact group-name match.
- Applies to all code blocks in current editor state.
- Keeps other directives and code unchanged.

## Out Of Scope

- Renaming groups.
- Partial selection-based ungrouping.
- Cross-project operations.

## UX Behavior

Visibility:
- Show menu item only for grouped selected blocks.

Label:
- Use dynamic label with current name:
  - `Ungroup "<groupName>"`

Safety:
- Optional MVP confirmation is not required unless accidental trigger risk is judged high.

## Data/Logic Contract

Input:
- `selectedCodeBlock.groupName`
- `graphicHelper.codeBlocks`

Target set:
- Blocks where derived `groupName` exactly equals selected block’s `groupName`.

Mutation:
- Remove matching `@group` directive line(s) from each target block.
- Update `lastUpdated` for mutated blocks.
- Trigger one state update path after batch mutation.

Post-condition:
- All formerly matching blocks no longer derive that `groupName`.

## Implementation Plan

### Step 1: Add menu item
- Extend block context menu generation with `Ungroup "<groupName>"`.
- Wire to a dedicated event (e.g. `ungroupByName`).

### Step 2: Add group-wide removal handler
- Implement batch directive removal across all blocks with same group name.
- Reuse existing `@group` directive removal helper if available.

### Step 3: Ensure derived metadata refresh
- Verify `groupName` is re-derived and cleared for all affected blocks.
- Ensure UI updates immediately after action.

### Step 4: Add tests
- Menu visibility/label tests.
- Effect tests:
  - removes group directive from every matching block
  - does not touch non-matching groups
  - does not touch unrelated directives
  - safe no-op when no matching blocks found
  - respects edit-disabled guard

### Step 5: Update docs
- Document `Ungroup "<groupName>"` action in editor docs.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"Ungroup|ungroupByName|@group\" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Grouped blocks expose `Ungroup "<groupName>"` in context menu.
- [ ] Action removes matching `; @group <groupName>` directives from all blocks in group.
- [ ] Other groups and unrelated directives remain unchanged.
- [ ] Tests cover menu label/visibility and batch removal behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant code block menu)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (group-wide ungroup handler)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` (metadata refresh behavior)
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Accidental broad edits**: operation affects many blocks at once; action naming must be explicit.
- **String matching**: exact-match rules should be tested to avoid removing similarly named groups.
- **Duplicate directives**: normalize by removing all matching `@group` lines per target block.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/222-add-remove-from-group-context-menu-action.md`
- **Related**: `docs/todos/221-add-skip-group-context-menu-action.md`

## Notes

- This TODO covers full-group ungrouping only; single-block removal remains a separate action.
