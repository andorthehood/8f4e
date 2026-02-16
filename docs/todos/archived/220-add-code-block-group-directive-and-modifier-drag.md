---
title: 'TODO: Add code-block grouping directive and modifier drag behavior'
priority: Medium
effort: 1-2d
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Add code-block grouping directive and modifier drag behavior

## Problem Description

Today code blocks can only be dragged individually. In larger projects, users often treat multiple blocks as a logical unit (for example related modules/functions that should stay near each other), but moving them requires repeated manual drag-and-snap operations.

The editor needs a lightweight, code-driven grouping mechanism so related blocks can be moved together without introducing a full layout system.

## Proposed Solution

Add an editor directive:

```txt
; @group <groupName>
```

When present in a code block, the block is assigned a runtime `groupName` in `graphicHelper.codeBlocks`. During drag:
- Normal drag behavior remains unchanged.
- If the user holds a modifier key (MVP: `Alt`/`Option`) while starting a drag, all blocks with the same `groupName` move and snap together.

No visual cue is included in this milestone.

## Scope (MVP)

- Parse `; @group <groupName>` from code block text.
- Store derived `groupName?: string` on each `CodeBlockGraphicData`.
- Support grouped drag only within current canvas/project state.
- Use `Alt` as the group-drag modifier for now.
- Preserve existing behavior for ungrouped blocks and normal drag.

## Out Of Scope (for this TODO)

- Visual indicators or badges for grouped blocks.
- Nested groups or group hierarchies.
- Cross-project/cross-file grouping.
- Group-level context-menu management UI.
- Persistent group metadata outside code directives.

## Syntax and Parsing Contract

Directive format:

```txt
; @group <groupName>
```

Parsing rules:
- Must be a semicolon editor directive line.
- Directive token must be exactly `group`.
- `<groupName>` is required; missing name means no group assignment.
- Group name is the first argument token after `@group`.
- Leading/trailing whitespace is ignored.
- Unknown directives remain ignored.
- If multiple valid `@group` directives exist in one block, use first-match behavior (document and test this explicitly).

Validation rules:
- Keep parser permissive for MVP (tokenized non-whitespace string).
- Do not reject names by character class unless there is an existing global convention to enforce.

## Data Model Changes

Add field:
- `CodeBlockGraphicData.groupName?: string`

Source of truth:
- Derived from `codeBlock.code` during graphic-data refresh/update cycle.
- Not serialized as standalone project metadata; directive in code remains canonical.

Consistency requirements:
- `groupName` must update when block code changes.
- Removing directive clears `groupName`.
- Renaming directive value updates `groupName` immediately after code recomputation.

## Interaction Behavior

### Mouse/Pointers

Current mouse event payload does not carry modifier state for drag logic. Extend internal pointer event object to include modifier info needed by dragger (`altKey` for MVP).

On `mousedown` over a block:
- Resolve dragged block as today.
- If modifier is active and dragged block has `groupName`, resolve drag set:
  - all code blocks with matching `groupName`.
- Else drag set contains only dragged block.

On `mousemove` during drag:
- Apply movement delta to each block in drag set.
- Preserve existing `stopPropagation` behavior to avoid viewport drag conflicts.

On `mouseup`:
- Snap every moved block in drag set to grid.
- Update both grid and pixel coordinates consistently.
- Clear drag state.

### Selection / z-order

Keep existing behavior:
- Selected block becomes dragged block.
- Existing “bring dragged block to front” logic remains.
- Do not reorder every grouped block in z-order during MVP.

## Architecture / File-Level Plan

1. Parser
- Add dedicated parser for group directive in editor-state code-blocks feature area (consistent with existing directive parsers).
- Export a small pure function:
  - input: `string[]` code lines
  - output: `string | undefined`

2. Graphic data derivation
- Integrate group parser into the code-block graphic update path where other derived runtime metadata is refreshed.
- Assign `graphicData.groupName` on each update pass.

3. Input event plumbing
- Extend internal mouse event type to carry modifier key info.
- Populate modifier state in host pointer event bridge (`packages/editor/src/events/pointerEvents.ts`).

4. Drag feature
- Update `codeBlockDragger` effect:
  - maintain current dragged block behavior for non-grouped drags
  - compute drag set for grouped drags
  - apply deltas and snap to all blocks in drag set

5. Documentation
- Update `packages/editor/docs/editor-directives.md` with new `@group` directive and concise drag behavior note.

## Detailed Implementation Steps

### Step 1: Add parser and tests
- Create `@group` code parser module and unit tests covering:
  - empty input
  - no directive
  - valid directive
  - leading whitespace variants
  - extra trailing tokens
  - missing group name
  - strict token behavior (`@group` vs similarly named directives)
  - first-match precedence when multiple directives exist

### Step 2: Add `groupName` to runtime block type
- Extend `CodeBlockGraphicData` with optional `groupName`.
- Ensure helper factories/mocks remain compatible (optional field avoids broad test churn).

### Step 3: Derive and refresh `groupName`
- In graphic recomputation path, assign parsed `groupName` each update cycle.
- Verify state updates correctly when code edits add/remove/rename directive.

### Step 4: Add modifier signal to pointer events
- Add `altKey` (or equivalent modifier field) to internal mouse event payload.
- Populate it from native pointer/mouse events, including wheel-path event object construction if required by shared type.

### Step 5: Group-aware drag behavior
- In dragger effect, compute drag set on drag start.
- Move all blocks in drag set by movement deltas.
- Snap all moved blocks on mouse up.
- Maintain existing behavior for non-grouped and modifier-not-held drags.

### Step 6: Add dragger tests
- New unit tests for `codeBlockDragger` covering:
  - non-modifier drag moves one block only
  - modifier drag moves all blocks in same group
  - unrelated/ungrouped blocks are unaffected
  - all moved blocks snap to grid on mouse up
  - stopPropagation remains true while dragging
  - modifier pressed but no group present falls back to single-block drag

### Step 7: Update docs
- Add `@group` section to editor directives doc.
- Mention that grouped movement is activated with modifier drag (MVP key: Alt/Option).
- Note current limitations (no visual cue, no nested groups).

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `npx nx run editor:test`
- `rg -n \"@group|groupName|altKey|codeBlockDragger\" packages/editor/packages/editor-state/src packages/editor/src`

## Success Criteria

- [ ] `; @group <groupName>` is parsed and reflected as `groupName` on runtime code blocks.
- [ ] Grouped drag works only when modifier is held.
- [ ] Non-modifier drag behavior is unchanged.
- [ ] Grouped drag moves and snaps all matching-group blocks.
- [ ] Blocks without valid group directive behave as ungrouped.
- [ ] Unit tests cover parser and dragger behavior.
- [ ] Editor directives documentation includes `@group`.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockDragger/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/codeParser*.ts` (new group parser + tests)
- `packages/editor/packages/editor-state/src/shared/types.ts`
- `packages/editor/src/events/pointerEvents.ts`
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Modifier portability**: Alt behavior can vary by OS/window manager. Keep MVP simple and revisit configurable modifier later if needed.
- **Mid-drag modifier changes**: Decide whether modifier is sampled at drag start only (recommended MVP) vs continuously.
- **Performance on large projects**: Filtering all blocks by group on drag start is likely fine, but should remain O(n) and avoid per-frame recomputation.
- **Directive ambiguity**: Must avoid accidental matches for similarly named directives.
- **Undo/history semantics**: Ensure grouped moves are captured as a single logical move in existing history behavior (validate current history integration).

## Related Items

- **Related**: `docs/todos/215-migrate-editor-directives-to-semicolon-comments-and-reserve-hash-for-compiler-directives.md`
- **Related**: `docs/todos/219-add-favorite-code-blocks-jump-menu-navigation.md` (index entry; file may be added separately)
- **Related**: `packages/editor/docs/editor-directives.md`

## Notes

- User decision for this TODO: skip visual cue for now.
- Keep implementation narrowly scoped to editor-state + pointer event bridge.
- Prefer additive, low-risk changes that preserve current drag defaults.
