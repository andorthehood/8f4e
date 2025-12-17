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

### Step 1: Extend metadata types and populate categories
- Add `category: string` to `ProjectMetadata`; ensure `ModuleMetadata` continues to use the same field.
- Update `src/examples/modules/index.ts` and `src/examples/projects/index.ts` entries to use slash-delimited categories where grouping is desired.
- Decide on defaults for missing categories (e.g., `Uncategorized`).

### Step 2: Build reusable category tree helper
- Create a small utility to transform a list of `{ category, title, slug }` into a nested tree based on `category.split('/')`, preserving order and labels.
- Include alpha sorting and filtering to avoid empty nodes.

### Step 3: Refactor module menus to use tree
- In `packages/editor/packages/editor-state/src/effects/menu/menus.ts`, replace flat `moduleCategoriesMenu`/`builtInModuleMenu` generation with nested menus driven by the tree helper.
- Use submenu payloads to navigate nodes; leaf items add the module via slug.

### Step 4: Add nested project menu
- Introduce a `projectCategoriesMenu`/`projectMenu` variant that groups projects by category path with the same tree helper.
- Ensure the main menu opens the project submenu that supports nesting.

### Step 5: Testing and validation
- Add/adjust unit tests around the tree helper and menu generation (vitest) to cover nested and flat cases, missing categories, and sorting.
- Manual check in the editor menu that nested categories show up and modules/projects can be added/loaded correctly.

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
