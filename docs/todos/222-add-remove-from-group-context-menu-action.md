---
title: 'TODO: Add "Remove from group" context-menu action'
priority: Medium
effort: 4-8h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add "Remove from group" context-menu action

## Problem Description

After assigning a block to a group with `; @group <groupName>`, users currently need to manually edit code to remove that directive.

For workflow consistency with other block-level actions, there should be a direct context-menu action that removes grouping from the selected block without opening code editing manually.

## Proposed Solution

Add a code-block context-menu action:
- `Remove from group`

Behavior:
- Visible only when selected code block has a valid `groupName`.
- On action, remove `; @group ...` directive line(s) from selected block code.
- Scope is single selected block only; no group-wide mutation in this TODO.

## Scope (MVP)

- Single-block directive removal from context menu.
- Keep parser/source-of-truth model intact (code directive is canonical).
- Trigger standard block update flow so `groupName` becomes `undefined` after mutation.

## Out Of Scope

- Renaming groups from context menu.
- Moving block to another group via menu.
- Batch “remove entire group” operations.

## UX Behavior

Visibility:
- Show `Remove from group` only if selected block is currently grouped.
- Hide on ungrouped blocks.

Action result:
- Remove grouping directive from selected block.
- Keep all other directives and code content unchanged.

## Implementation Plan

### Step 1: Menu action wiring
- Update the code-block/module context-menu generator to include `Remove from group`.
- Add a dedicated event (for example `removeFromGroupDirective`) to keep intent explicit.

### Step 2: Directive removal handler
- Implement handler in editor-state code-block feature layer.
- Remove only `@group` directive line(s) from selected block code.
- Update `lastUpdated` and trigger store write so derived metadata refreshes.

### Step 3: Parsing/metadata alignment
- Ensure derived `groupName` refresh path clears group metadata after directive removal.
- Confirm no stale `groupName` remains in `graphicHelper.codeBlocks`.

### Step 4: Tests
- Menu visibility tests:
  - action visible for grouped block
  - action hidden for ungrouped block
- Effect tests:
  - removes directive when present
  - no-op safety when absent
  - does not remove unrelated directives
  - respects edit-disabled guard

### Step 5: Documentation
- Update editor directives/context-menu docs to mention the new action.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"Remove from group|removeFromGroupDirective|@group\" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Grouped blocks show `Remove from group` in context menu.
- [ ] Action removes `; @group <groupName>` directive from selected block code.
- [ ] Block becomes ungrouped (`groupName` cleared in runtime metadata) after update.
- [ ] Ungrouped blocks do not show this menu item.
- [ ] Tests cover menu visibility and directive-removal behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant block menu)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (new/remove-group handler)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` (metadata refresh verification)
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Accidental over-removal**: removal logic must only target `@group`, not other `; @...` directives.
- **Multiple directives**: decide and test whether to remove first match or all `@group` lines (recommended: remove all to normalize state).
- **Dependency ordering**: feature depends on `groupName` derivation from TODO 220.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/221-add-skip-group-context-menu-action.md`

## Notes

- This TODO is intentionally single-block only; group-wide operations are covered by separate TODOs.
