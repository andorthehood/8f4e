---
title: 'TODO: Add sticky group mode via @group directive'
priority: Medium
effort: 1-2d
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Add sticky group mode via @group directive

## Problem Description

Current grouped dragging relies on holding a modifier key. For frequently moved group layouts, users want groups to always move together without requiring `Alt` on every drag.

## Proposed Solution

Extend the group directive syntax with an optional keyword:

```txt
; @group <groupName> [sticky]
```

When `sticky` is present:
- Dragging any member of that group moves the whole group automatically.
- No modifier key is required.

Menu actions:
- `Make Group Sticky`
- `Make Group Non-Sticky`

These actions should normalize state across all members of the selected block’s group.

## Scope (MVP)

- Parse optional second `sticky` argument on `@group`.
- Derive runtime `groupSticky` (or equivalent) metadata.
- Sticky groups always group-drag.
- Unsticky groups keep current behavior (group-drag only with modifier).
- Add menu actions to apply/remove sticky state group-wide.

## Out Of Scope

- Visual badges/indicators for sticky groups.
- Per-block sticky within a group as a long-term state (MVP normalizes whole group).
- Additional sticky modes beyond on/off.

## Behavior Rules

Drag precedence:
1. If selected block is in a sticky group: always group drag.
2. Else if selected block is in a non-sticky group and modifier is held: group drag.
3. Else: normal single-block drag.

Normalization:
- `Make Group Sticky` adds `sticky` to all group members.
- `Make Group Non-Sticky` removes `sticky` from all group members.

Conflict handling:
- If inconsistent state exists (some members sticky, others not), runtime may treat group as sticky when any member is sticky, then menu actions normalize to a consistent state.

## Syntax Contract

Accepted:
- `; @group foo`
- `; @group foo sticky`

Rejected/ignored for sticky:
- `; @group foo lock` (legacy idea, not adopted)
- unknown third argument semantics in MVP

Group name parsing:
- First argument token after `@group`.

Sticky parsing:
- Second argument token must be exact `sticky`.

## Implementation Plan

### Step 1: Update parser
- Extend group parser to return:
  - `groupName?: string`
  - `sticky?: boolean`
- Add parser tests for:
  - no second argument
  - exact `sticky`
  - invalid second token
  - whitespace variations

### Step 2: Extend runtime block metadata
- Add optional sticky metadata on code block graphic data (name to decide: `groupSticky` recommended).
- Ensure metadata is re-derived on code updates.

### Step 3: Dragger behavior update
- Update drag resolution to use precedence rules above.
- Sticky groups should use group drag even without modifier.
- Keep snapping behavior consistent for all moved members.

### Step 4: Menu actions
- Add grouped menu actions:
  - `Make Group Sticky`
  - `Make Group Non-Sticky`
- Show action labels based on effective group sticky state.

### Step 5: Group-wide mutation handlers
- Implement action handlers that add/remove sticky keyword for all group members.
- Keep group name unchanged.
- Update `lastUpdated` and store state once after batch mutation.

### Step 6: Tests
- Parser unit tests.
- Dragger tests for sticky precedence.
- Menu tests for label/visibility.
- Effect tests for group-wide sticky on/off code mutation.

### Step 7: Docs
- Update editor directives docs with `@group <name> sticky`.
- Clarify sticky vs modifier behavior.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"@group|sticky|Make Group Sticky|Make Group Non-Sticky\" packages/editor/packages/editor-state/src packages/editor/docs`

## Success Criteria

- [ ] `@group` supports optional `sticky` argument.
- [ ] Sticky groups always move together without modifier key.
- [ ] Non-sticky groups still require modifier for group drag.
- [ ] Context menu can enable/disable sticky for the whole group.
- [ ] Sticky state changes are reflected in code directives across all group members.
- [ ] Tests cover parser, drag behavior, and menu/effect flows.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/codeParser*.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`
- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant menu builder)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (sticky toggler)
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Directive rewriting**: mutation logic must preserve formatting/other directives where possible.
- **State drift**: ensure group-wide menu actions normalize inconsistent per-block sticky flags.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/221-add-skip-group-context-menu-action.md`
- **Related**: `docs/todos/222-add-remove-from-group-context-menu-action.md`
- **Related**: `docs/todos/223-add-ungroup-all-with-same-group-name-context-menu-action.md`

## Notes

- Expected UX: sticky means "always move together," not "prevent movement."
