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
- No persisted favorites list in project state.
- No context-menu entry to jump directly to favorited blocks.
- No dedicated event flow that resolves a favorite and centers the viewport on the target code block.

Impact:
- Navigation slows down as projects grow.
- Users must manually pan/scroll to return to key modules/functions.
- Important blocks cannot be bookmarked in a stable editor-native way.

## Proposed Solution

Implement a favorites pipeline in `@8f4e/editor-state` that:
- Detects favorites using a strict editor directive line: `; @favorite`.
- Derives a list of favorites from code blocks and stores it in state as `{ id, creationId }`.
- Recomputes favorites reactively when code blocks or selected/programmatic code block code changes.
- Persists favorites in project serialization.
- Exposes a `Jump to...` submenu in module context menu.
- Dispatches a jump action that resolves and centers the viewport on the chosen code block.

Design decisions:
- `creationId` is backed by runtime `creationIndex` to keep a stable block identity when `id` collides.
- Jump resolution should prefer `creationId` and only fallback to `id`.
- Favorites are derived from source directives, with persisted state retained for export/import compatibility.

## Anti-Patterns

- Do not infer favorites from block type, title, or position.
- Do not use loose matching that treats any semicolon comment as a directive.
- Do not resolve jump targets by `id` only when `creationId` exists.
- Do not duplicate favorites for multiple `; @favorite` lines inside the same block.

## Implementation Plan

### Step 1: Add favorite types to editor state
- Add a `FavoriteCodeBlock` shape with `id: string` and `creationId: number`.
- Extend `GraphicHelper` to include `favoriteCodeBlocks: FavoriteCodeBlock[]`.
- Initialize this list to `[]` in default/mock state helpers.

Expected outcome:
- State tree can hold favorites and tests can construct/fill it.

### Step 2: Implement directive parsing + derivation utility
- Add a parser that detects strict `; @favorite` lines.
- Add utility to derive favorites from `graphicHelper.codeBlocks`.
- Deduplicate by block identity (`creationIndex`) to ensure max one favorite per code block.

Expected outcome:
- Deterministic favorites derivation from source code blocks.

### Step 3: Add favorites effect with requested subscriptions
- Add a dedicated `favorites` effect module.
- Subscribe to:
  - `graphicHelper.codeBlocks`
  - `graphicHelper.selectedCodeBlock.code`
  - `graphicHelper.selectedCodeBlockForProgrammaticEdit.code`
- Recompute and store `graphicHelper.favoriteCodeBlocks`.

Expected outcome:
- Favorites list updates immediately when directive presence changes.

### Step 4: Add jump action and viewport centering
- Add event handler (e.g. `jumpToFavoriteCodeBlock`).
- Resolve target block by:
  - `creationIndex === creationId` first
  - fallback `id === id`
- Set selected block and center viewport with existing helper.
- Preserve existing viewport animation behavior conventions for programmatic navigation.

Expected outcome:
- Jump action reliably brings the selected favorite into view.

### Step 5: Add context menu integration
- Extend module context menu with `Jump to...` entry that opens a submenu.
- Add submenu generator that lists favorites.
- Each item dispatches jump event with favorite payload.
- Handle empty favorites with a disabled placeholder item.

Expected outcome:
- Users can open module context menu and jump to any favorited block.

### Step 6: Persist favorites in project import/export
- Extend `Project` type with optional `favoriteCodeBlocks`.
- Include favorites in `serializeToProject` and runtime-ready project serialization.
- Ensure loading path preserves compatibility with projects that omit this field.

Expected outcome:
- Favorites round-trip through save/export/import without breaking old project files.

### Step 7: Update docs and tests
- Update `packages/editor/docs/editor-directives.md` to document `@favorite`.
- Add tests for:
  - parser behavior
  - derivation/deduplication
  - effect subscriptions/recompute behavior
  - menu/submenu payload wiring
  - jump target resolution and viewport centering
  - serialization coverage

Expected outcome:
- Feature is documented and protected against regressions.

## Validation Checkpoints

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `rg -n "@favorite|favoriteCodeBlocks|jumpToFavoriteCodeBlock|Jump to" packages/editor/packages/editor-state packages/editor/docs`

## Success Criteria

- [ ] `; @favorite` marks a code block as favorite.
- [ ] Favorites are derived from directives and stored as `{ id, creationId }`.
- [ ] Favorites recompute on `codeBlocks`, `selectedCodeBlock.code`, and `selectedCodeBlockForProgrammaticEdit.code` changes.
- [ ] Module context menu contains `Jump to...` submenu listing favorites.
- [ ] Selecting a favorite recenters viewport on the intended block.
- [ ] Project export/import round-trips favorites safely.
- [ ] Tests cover parser, effect, menu, jump, and serialization paths.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts` - state shape extensions
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - default favorites
- `packages/editor/packages/editor-state/src/pureHelpers/testingUtils/testUtils.ts` - mock favorites defaults
- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts` - `Jump to...` entry
- `packages/editor/packages/editor-state/src/features/menu/menus/` - favorites submenu
- `packages/editor/packages/editor-state/src/features/menu/effect.ts` - submenu dispatch path (payload wiring)
- `packages/editor/packages/editor-state/src/features/viewport/centerViewportOnCodeBlock.ts` - reuse existing centering logic
- `packages/editor/packages/editor-state/src/features/project-import/types.ts` - project schema extension
- `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts` - persistence
- `packages/editor/docs/editor-directives.md` - directive documentation

## Risks & Considerations

- **Identity drift risk**: `id` can collide/rename; `creationId` must be the primary resolver.
- **Stale persisted favorites risk**: exported favorites may reference missing blocks in edited/imported projects.
- **Menu density risk**: long favorites lists can reduce context menu usability.
- **Behavior consistency risk**: jump navigation should align with existing programmatic viewport behavior.

Mitigations:
- Prefer `creationId` resolution.
- Ignore unresolved favorites gracefully.
- Keep menu item titles concise.
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
