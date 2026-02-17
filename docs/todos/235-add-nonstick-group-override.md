---
title: 'TODO: Add nonstick group override directive and menu actions'
priority: Medium
effort: 4-8h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add nonstick group override directive and menu actions

## Problem Description

Grouped drag is now the default behavior, which is correct for most cases. But some groups should remain grouped for organization while still allowing per-block dragging by default.

We need an explicit per-group override that flips grouped drag behavior back to single-block-first.

## Proposed Solution

Replace the sticky keyword/direction with a nonstick keyword (no backward compatibility):
- remove support for `; @group <groupName> sticky`
- use `; @group <groupName> nonstick` as the only explicit group-mode keyword

Behavior model:
- Default grouped blocks (`; @group <name>`): drag moves whole group.
- Nonstick grouped blocks (`; @group <name> nonstick`): drag moves selected block only.
- For nonstick groups, holding `Alt` temporarily group-drags the full group.

Menu actions:
- `Make Group Nonstick`
- `Make Group Sticky` (removes `nonstick` keyword and returns to default grouped drag)

## Scope (MVP)

- Remove sticky parsing, metadata, actions, and docs.
- Parse optional `nonstick` second argument on `@group`.
- Derive runtime flag (for example `groupNonstick`) from code.
- Apply drag precedence with default-grouped + nonstick override.
- Add group-level menu actions to normalize `nonstick` state across all members.
- Update docs and tests.

## Out Of Scope

- Extra group modes beyond default and nonstick.
- Visual badges/labels for nonstick.
- Removing `@group` itself.

## Behavior Rules

Drag precedence:
1. Grouped + no `nonstick`: group drag by default, `Alt` single-block override.
2. Grouped + `nonstick`: single-block drag by default, `Alt` group-drag override.
3. Ungrouped: single-block drag (unchanged).

Normalization:
- `Make Group Nonstick` applies `nonstick` keyword to all group members.
- `Make Group Sticky` removes `nonstick` keyword from all group members.

Conflict handling:
- If mixed state exists, menu actions normalize group to a consistent mode.

## Implementation Plan

### Step 1: Update `@group` parser and metadata
- Remove `sticky` token support entirely.
- Parse second token for exact `nonstick`.
- Derive runtime group mode flag from code updates.

### Step 2: Update dragger precedence
- Implement behavior rules above in `codeBlockDragger`.
- Keep snap logic unchanged for moved set.

### Step 3: Add menu actions and handlers
- Add `Make Group Nonstick` / `Make Group Sticky`.
- Implement group-wide directive rewrite for mode normalization.

### Step 4: Tests
- Parser tests for `nonstick` token handling.
- Dragger tests for both default and nonstick groups with/without `Alt`.
- Menu/effect tests for group-wide mode toggling.

### Step 5: Docs
- Update directive docs to include `; @group <name> nonstick`.
- Document drag precedence clearly.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"nonstick|Make Group Nonstick|Make Group Sticky|groupName|altKey\" packages/editor/packages/editor-state/src packages/editor/docs`

## Success Criteria

- [ ] `@group` supports optional `nonstick`.
- [ ] `sticky` keyword is no longer supported anywhere.
- [ ] Default grouped drag remains group-first.
- [ ] Nonstick groups drag single-block by default.
- [ ] `Alt` behavior inverts correctly for nonstick groups.
- [ ] Menu actions can toggle mode group-wide and normalize inconsistent states.
- [ ] Tests and docs match final behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/codeParser*.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`
- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant menu builder)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (mode toggler)
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Terminology drift**: keep naming consistent as `nonstick` everywhere.
- **Mixed-mode groups**: ensure runtime and menu actions handle inconsistent source cleanly.
- **Behavior complexity**: explicit tests needed for all modifier/mode combinations.

## Related Items

- **Related**: `docs/todos/224-add-sticky-group-directive-and-menu-actions.md` (superseded direction)
- **Depends on**: `docs/todos/233-make-group-drag-default-and-alt-single-block-override.md`

## Notes

- Product decision: replace sticky with nonstick, no compatibility layer required.
