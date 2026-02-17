---
title: 'TODO: Make grouped drag default and Alt drag single-block override'
priority: Medium
effort: 4-8h
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Make grouped drag default and Alt drag single-block override

## Problem Description

Current implemented behavior requires holding `Alt` to move grouped blocks together. This adds friction for the common case where grouped blocks are intended to be moved as a unit.

The desired interaction is inverted:
- grouped blocks should move together by default
- `Alt` should temporarily force single-block drag for a grouped block

## Proposed Solution

Change drag precedence in `codeBlockDragger`:

1. If dragged block has `groupName` and `Alt` is **not** pressed:
- drag all blocks with same `groupName`

2. If dragged block has `groupName` and `Alt` **is** pressed:
- drag only the selected block

3. If dragged block has no `groupName`:
- drag only the selected block (unchanged)

No directive syntax changes are required for this TODO.

## Scope (MVP)

- Update editor drag behavior only.
- Preserve existing snap-to-grid behavior for all moved blocks.
- Keep selection and z-order behavior unchanged.
- Add/update tests and docs.

## Out Of Scope

- Sticky groups (`@group <name> sticky`) behavior changes.
- New UI indicators or cursor hints.
- Group menu changes.

## Implementation Plan

### Step 1: Update dragger logic
- Modify grouped drag condition in `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`.
- Invert modifier semantics so `Alt` means single-block override for grouped blocks.

### Step 2: Keep pointer event payload compatibility
- Reuse existing `InternalMouseEvent.altKey` plumbing.
- Confirm `mousedown` handler resolves drag set using `altKey` state.

### Step 3: Update tests
- Add/adjust unit tests to verify:
  - grouped block drags whole group without `Alt`
  - grouped block drags only itself with `Alt`
  - ungrouped block behavior unchanged
  - snapping still applies to all moved members in grouped drag mode

### Step 4: Update docs
- Update editor directives/interaction docs to reflect new default behavior.
- Replace mentions of “Alt for grouped drag” with “Alt for single-block override.”

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"groupName|altKey|codeBlockDragger\" packages/editor/packages/editor-state/src`
- `rg -n \"Alt|group drag|@group\" packages/editor/docs`

## Success Criteria

- [ ] Grouped blocks move together by default on drag.
- [ ] Holding `Alt` while dragging a grouped block moves only that block.
- [ ] Ungrouped block dragging is unchanged.
- [ ] Tests and docs reflect the new interaction model.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/docs/editor-directives.md` (or related interaction docs)

## Risks & Considerations

- **Muscle memory change**: users familiar with old modifier behavior may need updated docs/changelog notes.
- **Sticky interaction overlap**: if sticky mode is implemented later, precedence rules must remain explicit and tested.

## Related Items

- **Related**: `docs/todos/archived/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/224-add-sticky-group-directive-and-menu-actions.md`

## Notes

- Reason for this TODO: original Alt-group-drag behavior was already implemented, and product direction changed to make grouped dragging the default.
