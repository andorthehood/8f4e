---
title: 'TODO: Use CodeBlock id instead of recomputing from code'
priority: Low
effort: 2-4 days
created: 2026-01-22
status: Completed
completed: 2026-01-23
---

# TODO: Use CodeBlock id instead of recomputing from code

## Problem Description

The system frequently derives code block IDs by calling `getCodeBlockId(code)` during updates and rendering. This is redundant because `CodeBlockGraphicData.id` is intended to be the canonical ID. Recomputing on every update adds overhead and can lead to inconsistencies if code changes impact the derived ID unexpectedly.

## Proposed Solution

Treat `CodeBlockGraphicData.id` as the source of truth and stop recalculating IDs from code during normal update flows. Only assign IDs at creation time (or on explicit re‑ID operations if needed). Ensure the ID is updated when code changes require a new ID (for example, when a module name changes).

## Implementation Plan

### Step 1: Inventory usages
- Find all usages of `getCodeBlockId` in runtime code paths.
- Identify which ones are only needed at creation time.

### Step 2: Shift to creation-time assignment
- Ensure `id` is set when code blocks are created/imported.
- Remove or guard any `getCodeBlockId(code)` calls during updates/rendering.
- Add a targeted update path that refreshes `id` when code changes require it.

### Step 3: Verify behavior
- Add/adjust tests to confirm IDs stay stable across edits.
- Ensure any functionality that depends on derived IDs still works.

## Success Criteria

- [x] No runtime code path recomputes code block IDs on each update
- [x] IDs are assigned once during creation/import and remain stable
- [x] IDs update when code changes make the derived ID invalid
- [x] Tests cover ID stability across edits

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` - currently recomputes `graphicData.id`
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/getCodeBlockId.ts` - usage reduction
- Any other code paths that call `getCodeBlockId` outside creation

## Risks & Considerations

- **Risk 1**: Some existing behaviors may rely on IDs changing when code changes.
- **Risk 2**: Imported projects might contain legacy or duplicate IDs.
- **Dependencies**: None.
- **Breaking Changes**: Possible if external consumers assume IDs are derived from code.

## Related Items

- **Related**: `docs/todos/197-editor-config-blocks.md`

## Notes

- Consider adding validation to ensure IDs are unique at creation/import time.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
