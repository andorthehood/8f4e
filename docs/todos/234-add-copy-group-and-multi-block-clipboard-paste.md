---
title: 'TODO: Add Copy Group and multi-block clipboard paste'
priority: Medium
effort: 1-2d
created: 2026-02-16
status: Open
completed: null
---

# TODO: Add Copy Group and multi-block clipboard paste

## Problem Description

Current copy/paste flow is single-block string based. With group features, users need to duplicate whole groups while preserving relative layout.

We need:
- `Copy group` menu action
- multi-block clipboard format for group copy
- paste logic that supports both:
  - single-block string paste
  - multi-block array paste

## Proposed Solution

Implement dual clipboard behavior:

1. Single block copy/paste
- Keep existing plain string behavior.

2. Multi-block (group) copy/paste
- Copy as plain JSON array (no envelope fields like `type` or `version`).
- Each array item follows project code-block shape:
  - `code`
  - `gridCoordinates`
  - optional `disabled`
- `gridCoordinates` in clipboard array are relative offsets from anchor block.

## Clipboard Data Contract

Multi-copy payload example:

```json
[
  {
    "code": ["module foo", "moduleEnd"],
    "gridCoordinates": { "x": 0, "y": 0 },
    "disabled": false
  },
  {
    "code": ["module bar", "moduleEnd"],
    "gridCoordinates": { "x": 12, "y": 4 },
    "disabled": false
  }
]
```

Rules:
- Array length `>= 2` means multi-block payload candidate.
- `gridCoordinates` are relative to copy anchor (`0,0` for anchor).
- Object shape should match project code block shape.

## Paste Detection Rules

On paste:
1. Read clipboard text.
2. Attempt `JSON.parse`.
3. If parsed value is an array with length `>= 2` and every item matches expected code-block shape:
- treat as multi-block paste.
4. Otherwise:
- fallback to existing single-block string paste path.

This keeps plain-text single module workflows unchanged.

## Copy Group Behavior

Menu item:
- `Copy group`

Eligibility:
- Show only when selected block has `groupName`.

Operation:
- Collect all blocks with same `groupName`.
- Choose anchor block (recommended: selected block).
- For each copied block:
  - copy `code`
  - copy `disabled` (if present)
  - set relative `gridCoordinates` = blockGrid - anchorGrid
- Serialize array as JSON string into clipboard.

## Multi-Block Paste Behavior

Placement:
- Paste target position defines destination anchor.
- For each copied block:
  - newGrid = pasteAnchorGrid + relativeGrid

Additional behavior:
- Preserve copied order deterministically (recommended: creation order).
- Maintain existing collision behavior unless there is an established free-space placement helper.

### Group name collision handling on paste

When pasted array blocks contain `@group` directives, pasted groups must not collide with existing group names in the project.

Rule per pasted group name:
- If the group name ends with a number, increment that trailing number.
- If the group name does not end with a number, append `1`.

Examples:
- `foo` -> `foo1`
- `foo1` -> `foo2`
- `bass09` -> `bass10`

Conflict resolution loop:
- After generating candidate name, if it still collides with an existing group, repeat the same rule until a free name is found.
- Apply one consistent renamed group per original pasted group name across all pasted blocks.

## Implementation Plan

### Step 1: Add Copy Group menu action
- Add `Copy group` to context menu for grouped blocks.
- Wire event action in editor-state.

### Step 2: Implement group copy serializer
- Build helper to serialize grouped blocks into JSON array payload with relative `gridCoordinates`.
- Reuse existing clipboard callback (`writeClipboardText`).

### Step 3: Implement paste parser/dispatcher
- Add parser that distinguishes valid multi-block array payload from plain text.
- Route to:
  - multi-block insertion path for arrays
  - existing single-block parser for strings

### Step 4: Implement multi-block insertion
- Insert multiple blocks using relative offsets from paste anchor.
- Reuse existing code-block creation flow where possible.
- Rewrite pasted group names using collision rule before insertion.

### Step 5: Tests
- Unit tests for clipboard payload validation.
- Copy-group tests (payload shape + relative offsets).
- Paste tests:
  - valid array payload -> multi insert
  - invalid JSON -> fallback single
  - JSON but not valid block array -> fallback single
  - single string remains unchanged
  - group rename: `foo` -> `foo1` on collision
  - group rename: `foo1` -> `foo2` on collision
  - repeated collision resolution loops until unique name found

### Step 6: Docs update
- Document clipboard behavior:
  - single copy is string
  - group copy is JSON array
  - paste auto-detect logic

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"Copy group|readClipboardText|writeClipboardText|JSON.parse|gridCoordinates\" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] Grouped blocks expose `Copy group` action.
- [ ] `Copy group` writes JSON array payload with relative `gridCoordinates`.
- [ ] Single copy/paste as string remains functional.
- [ ] Paste correctly detects and inserts multi-block array payloads.
- [ ] Invalid/non-matching JSON falls back to string paste behavior.
- [ ] Pasted group names are automatically renamed to avoid collision (`name` -> `name1`, `name9` -> `name10`, repeat until unique).
- [ ] Tests cover serializer, parser, and insertion behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` (or relevant menu)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/effect.ts` (copy-group handler)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/docs/editor-directives.md` (or clipboard/editor behavior docs)

## Risks & Considerations

- **Shape ambiguity**: JSON that parses but is not a valid block-array must reliably fall back.
- **Relative offset correctness**: anchor/reference calculations must use grid coordinates, not pixel coordinates.
- **Large groups**: clipboard size and insertion performance should remain acceptable.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/223-add-ungroup-all-with-same-group-name-context-menu-action.md`
- **Related**: `docs/todos/233-make-group-drag-default-and-alt-single-block-override.md`

## Notes

- Product requirement: no clipboard envelope metadata (`type`, `version`) for multi-copy payload.
- Product requirement: keep single-module copy/paste as plain string.
