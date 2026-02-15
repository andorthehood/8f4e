---
title: 'TODO: Add Favorite Code Blocks + Jump Menu Navigation'
priority: Medium
effort: 1-2d
created: 2026-02-13
status: Open
completed: null
---

# TODO: Add Favorite Code Blocks + Jump Menu Navigation

## Problem Description

The editor does not currently provide a way to mark important code blocks and quickly jump back to them from the context menu.

Current gaps:
- No `; @favorite` editor directive support.
- No context-menu entry to jump directly to favorited blocks from the main (empty-space) menu.
- No dedicated event flow that resolves a favorite and centers the viewport on the target code block.

Impact:
- Navigation slows down as projects grow.
- Users must manually pan/scroll to return to key modules/functions.
- Important blocks cannot be bookmarked in a stable editor-native way.

## Proposed Solution

Implement a favorites pipeline in `@8f4e/editor-state` that:
- Detects favorites using a strict editor directive line: `; @favorite`.
- Derives favorites on-demand from `graphicHelper.codeBlocks` when opening the `Jump to...` submenu.
- Exposes `Jump to...` only in the main (empty-space) context menu.
- Uses submenu labels in `blockType id` format to reduce ambiguity for duplicate ids.
- Dispatches a jump action that resolves and centers the viewport on the chosen code block.

Design decisions:
- `creationId` is backed by runtime `creationIndex` to keep a stable block identity when `id` collides.
- Jump payload should carry both `creationId` and `id`; resolution prefers `creationId` and may fallback to `id`.
- Favorites are transient/derived data and should not be persisted in project JSON or global editor state.

## Anti-Patterns

- Do not infer favorites from block type, title, or position.
- Do not use loose matching that treats any semicolon comment as a directive.
- Do not resolve jump targets by `id` only when `creationId` exists.
- Do not duplicate favorites for multiple `; @favorite` lines inside the same block.

## Implementation Plan

### Step 1: Implement directive parsing + derivation utility
- Add a parser that detects strict `; @favorite` lines.
- Add utility to derive favorites from `graphicHelper.codeBlocks` on demand.
- Deduplicate by block identity (`creationIndex`) to ensure max one favorite per code block.
- Include all block types (`module`, `function`, shaders, `comment`, etc.) when directive is present.

Expected outcome:
- Deterministic favorites derivation from source code blocks.

### Step 2: Add jump action and viewport centering
- Add event handler (e.g. `jumpToFavoriteCodeBlock`).
- Resolve target block by:
  - `creationIndex === creationId` first
  - optional fallback `id === id`
- Set selected block and center viewport with existing `centerViewportOnCodeBlock` helper.
- Preserve existing viewport animation behavior conventions for programmatic navigation.
- If target cannot be resolved, no-op.

Expected outcome:
- Jump action reliably brings the selected favorite into view.

### Step 3: Add context menu integration
- Extend main menu (empty-space context menu) with `Jump to...` entry that opens a submenu.
- Add submenu generator that derives and lists favorites at menu-open time.
- Each item dispatches jump event with favorite payload.
- Format labels as `blockType id`.
- Handle empty favorites with a disabled placeholder item.

Expected outcome:
- Users can open the empty-space context menu and jump to any favorited block.

### Step 4: Update docs and tests
- Update `packages/editor/docs/editor-directives.md` to document `@favorite`.
- Add tests for:
  - parser behavior
  - derivation/deduplication
  - main-menu `Jump to...` submenu generation
  - label format (`blockType id`)
  - menu/submenu payload wiring
  - jump target resolution and viewport centering

Expected outcome:
- Feature is documented and protected against regressions.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "@favorite|jumpToFavoriteCodeBlock|Jump to" packages/editor/packages/editor-state packages/editor/docs`

## Success Criteria

- [ ] `; @favorite` marks a code block as favorite.
- [ ] Favorites are derived on-demand from directives when opening `Jump to...`.
- [ ] Main (empty-space) context menu contains `Jump to...` submenu listing favorites.
- [ ] Favorite menu labels use `blockType id`.
- [ ] Selecting a favorite recenters viewport on the intended block.
- [ ] Tests cover parser, menu, and jump behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/features/menu/menus/mainMenu.ts` - `Jump to...` entry
- `packages/editor/packages/editor-state/src/features/menu/menus/` - favorites submenu
- `packages/editor/packages/editor-state/src/features/menu/effect.ts` - submenu dispatch path (payload wiring)
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockNavigation/effect.ts` - jump event handling and centering
- `packages/editor/packages/editor-state/src/features/viewport/centerViewportOnCodeBlock.ts` - reuse existing centering logic
- `packages/editor/docs/editor-directives.md` - directive documentation

## Risks & Considerations

- **Identity drift risk**: `id` can collide/rename; `creationId` must be the primary resolver.
- **Transient resolution risk**: a target block may be missing by click time; this should no-op.
- **Menu density risk**: long favorites lists can reduce context menu usability.
- **Behavior consistency risk**: jump navigation should align with existing programmatic viewport behavior.

Mitigations:
- Prefer `creationId` resolution.
- Ignore unresolved favorites gracefully.
- Use `blockType id` for compact but disambiguated labels.
- Reuse existing viewport centering helper and animation conventions.

## Related Items

- **Related**: `docs/todos/215-migrate-editor-directives-to-semicolon-comments-and-reserve-for-compiler-directives.md`
- **Related**: `docs/todos/218-add-context-menu-skip-unskip-module-directive.md`
- **Related**: `docs/todos/203-use-codeblock-id.md`

## Notes

- This plan was created before implementation due to timeline constraints.
- No feature code should be merged under this TODO without corresponding test coverage.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to `docs/todos/archived/`.
3. Update `docs/todos/_index.md`:
   - Move this TODO from Active to Completed.
   - Include completion date.
