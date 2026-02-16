---
title: 'TODO: Add "Skip group" context-menu action for grouped code blocks'
priority: Medium
effort: 1-2d
created: 2026-02-16
status: Completed
completed: 2026-02-16
---

# TODO: Add "Skip group" context-menu action for grouped code blocks

## Problem Description

There is already support for skipping execution at the code-block level via the `skipExecution` directive, but applying it across a related set of blocks is still manual.

When a project uses block grouping (`; @group <groupName>`), users should be able to skip all blocks in that group from one context-menu action instead of toggling each block one by one.

## Proposed Solution

Add a new code-block context-menu action:
- `Skip group`

Behavior:
- Action is shown when selected block has a valid `groupName`.
- Selecting `Skip group` applies skipExecution directive insertion to every block in that same group.
- If all group blocks are already skipped, label should switch to `Unskip group` and remove directive from all group blocks.

Directive semantics:
- Reuse existing skip directive contract and shared parser helpers.
- Keep exact insertion/removal rules consistent with current single-block skip/unskip action.

## Scope (MVP)

- Group-wide skip/unskip via context menu.
- Group resolved from selected block’s `groupName` derived from `; @group`.
- Apply only to blocks currently loaded in the active editor state.
- Atomic, consistent mutation over the full group.

## Out Of Scope

- Partial per-block confirmation dialogs.
- Group management UI.
- Cross-project group operations.
- New skip directive syntax.

## UX Behavior

Menu visibility:
- Show group action only if selected block has `groupName`.
- Hide for ungrouped blocks.

Menu label rules:
- `Skip group` when at least one block in the group is not skipped.
- `Unskip group` when all blocks in the group are skipped.

Conflict handling:
- If group contains non-module blocks, define one clear policy for MVP:
  - recommended: apply only to module blocks and leave other block types unchanged.
- Menu text should remain simple; avoid exposing internal type constraints in label.

## Data and Logic Contract

Inputs:
- `selectedCodeBlock`
- `selectedCodeBlock.groupName`
- `graphicHelper.codeBlocks`

Derived group set:
- All code blocks with matching `groupName` value.

Skip status source:
- Existing skip directive detection helper (same helper used by current single-block skip feature).

Mutation strategy:
- Batch over all eligible blocks in group.
- For each block:
  - insert directive if action is skip
  - remove directive(s) if action is unskip
- Touch `lastUpdated` for each changed block.
- Trigger one store update path to refresh UI and derived metadata.

## Architecture / File-Level Plan

1. Menu integration
- Extend module/context menu generator to add `Skip group`/`Unskip group` item.
- Add corresponding event action (e.g. `toggleGroupSkipExecutionDirective`).

2. Group toggle effect
- Implement effect handler in code-block feature area near existing skip toggler logic.
- Reuse existing skip insertion/removal helpers where possible to avoid parser drift.

3. Shared utility extraction (if needed)
- If single-block and group-block logic diverge, extract:
  - `isBlockSkipped(codeBlock)`
  - `insertSkipDirective(codeBlock)`
  - `removeSkipDirective(codeBlock)`
- Keep behavior identical between single and group actions.

4. Tests
- Menu tests for visibility/label logic.
- Effect tests for group-wide insertion/removal and non-module handling.

5. Documentation
- Add a short note in editor docs about group skip context-menu action.

## Detailed Implementation Steps

### Step 1: Confirm dependency on group feature
- Ensure TODO 220 (`; @group`) is completed or at least represented in runtime (`groupName` on code blocks).
- If unavailable, block implementation and keep this TODO open with dependency note.

### Step 2: Add menu action and label logic
- Update menu builder to compute group set from selected block’s `groupName`.
- Derive whether all group blocks are skipped.
- Render `Skip group` / `Unskip group` accordingly.

### Step 3: Implement group skip toggle event handler
- Register new event listener.
- Resolve group members once per action.
- Apply mutation consistently to each eligible block.
- Update store once after batch mutation.

### Step 4: Define non-module handling policy
- Recommended MVP: skip only module blocks.
- Add explicit guard and tests so behavior is deterministic.

### Step 5: Add tests
- `Skip group` inserts directive into all eligible blocks.
- `Unskip group` removes directive from all eligible blocks.
- Mixed group (module + non-module) only changes eligible blocks.
- No-op safety when group empty or selected block has no group.
- Edit-disabled mode prevents mutation.

### Step 6: Docs update
- Update directive/menu docs with grouped skip action behavior and limitations.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n \"Skip group|Unskip group|toggleGroupSkipExecutionDirective|groupName\" packages/editor/packages/editor-state/src`
- `rg -n \"skipExecution\" packages/editor/packages/editor-state/src/features`

## Success Criteria

- [ ] Grouped blocks expose a `Skip group` context-menu action when grouped.
- [ ] Action inserts skip directive for all eligible blocks in group.
- [ ] Label switches to `Unskip group` when whole eligible group is already skipped.
- [ ] `Unskip group` removes skip directive from all eligible blocks in group.
- [ ] Behavior is covered by automated tests.
- [ ] Existing single-block skip/unskip behavior remains unchanged.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/skipExecutionToggler/effect.ts` (or sibling group-skip effect)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**/__tests__/**`
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts` (consumes `groupName` from TODO 220)
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Behavior drift**: group toggle and single toggle can diverge if logic is duplicated. Prefer shared helpers.
- **Mixed block types**: unclear expectations unless explicitly documented and tested.
- **Large groups**: batch updates must remain efficient and should not trigger excessive recomputations.
- **Dependency order**: this feature depends on stable `groupName` derivation from `; @group`.

## Related Items

- **Depends on**: `docs/todos/220-add-code-block-group-directive-and-modifier-drag.md`
- **Related**: `docs/todos/218-add-context-menu-skip-unskip-module-directive.md`
- **Related**: `docs/todos/217-add-first-compiler-directive-skip-module-execution-in-cycle.md`

## Notes

- User request explicitly asks for a separate TODO for this action, not immediate implementation.
- Keep naming in UI exactly `Skip group` / `Unskip group` unless product copy changes later.
