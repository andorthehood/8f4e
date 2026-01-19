---
title: 'TODO: Split Editor-State Types by Feature'
priority: Medium
effort: 1-2d
created: 2026-01-16
status: Completed
completed: 2026-01-17
---

# TODO: Split Editor-State Types by Feature

## Problem Description

The `packages/editor/packages/editor-state/src/types.ts` file has grown large and contains types spanning many features. This makes it harder to locate and evolve feature-specific definitions, increases merge conflicts, and obscures ownership boundaries between editor-state features.

## Proposed Solution

Move feature-scoped types into `types.ts` modules under each feature folder, introduce a small shared-types module for cross-feature primitives, and re-export from the editor-state public API so consumer imports remain stable.

Alternative approaches considered:
- Keeping a single `types.ts` with region comments: rejected because it doesn't reduce file size or improve feature locality.
- Splitting into a `types/` folder at root only: better but still mixes features and discourages ownership clarity.

## Implementation Plan

### Step 1: Inventory and map types to features
- Catalog types/interfaces in `editor-state/src/types.ts` and map each to a feature or shared bucket.
- Identify cross-feature primitives (e.g., coordinates, viewport, runtime registry) that should live in a shared module.
- Note any re-exported types that must remain part of the public API.

### Step 2: Create feature-local type modules
- Add `types.ts` files inside `editor-state/src/features/<feature>/` for feature-specific types.
- Move definitions from the root file into these modules, preserving names and docstrings.
- Introduce a shared module (e.g., `editor-state/src/shared/types.ts`) for cross-feature primitives.

### Step 3: Update imports and public exports
- Update feature code to import from its local `types.ts` module or shared types.
- Re-export all public types from `editor-state/src/index.ts` (and optionally keep a thin `src/types.ts` barrel) to avoid breaking consumer imports.
- Run typecheck to ensure imports resolve cleanly and no circular dependencies are introduced.

## Success Criteria

- [ ] `editor-state/src/types.ts` is reduced to a thin barrel or removed.
- [ ] Feature-specific types live alongside their feature logic under `src/features/**`.
- [ ] Public API remains stable with re-exports from `editor-state/src/index.ts`.
- [ ] `npm run typecheck` succeeds with no new circular or missing import errors.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - split into feature-local modules
- `packages/editor/packages/editor-state/src/features/**` - new `types.ts` files and updated imports
- `packages/editor/packages/editor-state/src/index.ts` - re-exports for public API stability

## Risks & Considerations

- **Circular dependencies**: splitting types may create new import cycles if shared types are not carefully isolated.
- **Public API stability**: consumers might import directly from `src/types.ts`; ensure a backward-compatible barrel.
- **Ownership boundaries**: some types may not map cleanly to a single feature; keep a shared module minimal.

## Related Items

- **Related**: `docs/todos/176-editor-state-feature-readmes.md` (feature-local docs benefit from feature-local types)

## Notes

- Keep new modules aligned with Prettier formatting and existing export conventions.
- Consider adding a lightweight `types/index.ts` in editor-state if a root barrel is preferable.
