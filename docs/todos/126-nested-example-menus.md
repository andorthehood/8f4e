---
title: 'TODO: Nested example menus for modules and projects'
priority: Medium
effort: 1-2 days
created: 2025-12-17
status: Open
completed: null
---

# TODO: Nested example menus for modules and projects

## Problem Description

Example modules and projects are surfaced in the editor menu as a single-level category list (modules) or flat list (projects). Categories cannot be nested (e.g., `Functions/Quadratic`), making it hard to organize larger sets and forcing awkward single-bucket groupings.

## Proposed Solution

- Keep a single `category` string in metadata but interpret `/` as a path separator to build nested submenus.
- Update module and project metadata to use slash-delimited categories where relevant.
- Refactor menu generation to build a tree from category paths and render nested menus for modules and projects.
- Keep ordering deterministic (alpha) and handle empty categories or missing category values gracefully.

## Implementation Plan

### Step 1: Extend metadata types and normalize categories
- Add required `category: string` to `ProjectMetadata`; keep required `ModuleMetadata.category`.
- Assign categories for `src/examples/projects/index.ts` (see suggested grouping below).
- Define a minimal normalization rule for category input (split on `/`, trim whitespace only).

### Step 2: Build a reusable category tree + menu builder
- Create a helper that takes items shaped like `{ title, slug, category }`, normalizes the category path, and builds a tree of nodes + leaves.
- Sort category nodes and leaves alphabetically by their display label (deterministic ordering).
- Provide a small utility to turn a tree node into `ContextMenuItem[]` for a given node path.

### Step 3: Make submenu navigation payload-aware
- Update `ContextMenu.menuStack` to store `{ menu, payload }` instead of only `menu` so nested levels can restore the correct parent state.
- Store only the minimal payload needed for menu reconstruction (avoid storing click coordinates).
- Update `openSubMenu` to push `{ menu, payload }` and update `menuBack` to pop and reopen the previous menu with its stored payload.
- Ensure `menuBack` awaits menu generators so async menus remain consistent.

### Step 4: Refactor module menus to use tree
- Replace `moduleCategoriesMenu`/`builtInModuleMenu` with a single tree-driven menu that accepts a payload `{ path?: string[] }`.
- Use `openSubMenu` items for category nodes and `addCodeBlockBySlug` for leaf modules.

### Step 5: Add nested project menu
- Replace `projectMenu` with a tree-driven menu using the same helper and payload shape.
- Update the main menu to open the new project menu (top-level path).

### Step 6: Testing and validation
- Add/adjust unit tests for the category tree helper (nested + flat, missing category, sorting).
- Add tests for menu generation + menuBack payload restoration (modules + projects).
- Manual check in the editor menu that nested categories render and modules/projects load as expected.

### Suggested project categories
- Audio: `audioBuffer`, `audioLoopback`
- MIDI: `midiArpeggiator`, `midiArpeggiator2`, `midiBreakBeat`, `midiBreakBreak2dSequencer`
- Synthesis: `bistableMultivibrators`, `ericSaiteGenerator`, `randomGenerators`, `randomNoteGenerator`, `simpleCounterMainThread`
- Visuals: `dancingWithTheSineLT`, `neuralNetwork`, `rippleEffect`
- Misc: `standaloneProject`

## Success Criteria

- [ ] Modules with `category` containing `/` render as nested submenus; selecting a leaf adds the module by slug.
- [ ] Projects show nested categories and load correctly from leaf selections.
- [ ] Flat categories still work and appear in deterministic alphabetical order.
- [ ] Tests cover tree building and menu generation for nested and flat data.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` — add project category field.
- `packages/editor/packages/editor-state/src/effects/menu/menus.ts` — menu generation for modules/projects.
- `src/examples/modules/index.ts` and `src/examples/projects/index.ts` — metadata categories.

## Risks & Considerations

- Category strings must be sanitized/split consistently (`/` separator only).
- Large category trees could add menu depth; ensure menu stack UX remains usable.
- Sorting changes may shift current ordering; communicate if needed.

## Related Items

- Related: context menu UX for examples; potential future expansion to search/filter.

## References

- Existing menu generation logic in `menus.ts`.

## Notes

- None.
