---
title: 'TODO: Extract Editor State Into Dedicated Package'
priority: Medium
effort: 3 days
created: 2025-10-21
status: Completed
completed: null
---

# TODO: Extract Editor State Into Dedicated Package

## Problem Description

`packages/editor/src` currently mixes the state management graph, selectors, effects, and the public entry point in a single package. Internal modules import each other via deep relative paths, and external consumers occasionally reach into non-exported files for helpers. This structure makes it difficult to enforce clear boundaries between stateful logic and UI/editor integration, complicates reuse (e.g., future headless or testing contexts), and increases the risk of circular dependencies when new features land.

## Proposed Solution

Carve the editor's stateful logic into a new Nx package `packages/editor-state` published internally as `@8f4e/editor-state`. The package will encapsulate core state types, reducers, selectors, effects, and factories. The existing `packages/editor` package will re-export the state APIs needed by the UI entry point and will focus on rendering concerns. Update workspace aliases, tsconfig paths, Jest config, and Vite bundling so the new package participates in builds and tests independently. Ensure consumers only rely on the public API surface to prevent future deep imports.

## Implementation Plan

### Step 1: Inventory Current State Modules
- Catalogue files under `packages/editor/src` (excluding `index.ts`) and map their dependencies.
- Identify modules that must remain with the UI (e.g., renderer glue) versus pure state logic that can move.
- Highlight cross-package consumers to plan alias updates.

### Step 2: Scaffold `@8f4e/editor-state`
- Generate `packages/editor-state` structure with package metadata, tsconfig, Jest, and build configuration mirroring existing packages.
- Register the package in Nx (`nx.json`, `project.json`), root `tsconfig.base.json`, and Vite alias configuration.
- Add placeholder exports to confirm the package compiles before migration.

### Step 3: Migrate State Files and Update Imports
- Move all non-entry files into `packages/editor-state`, preserving folder layout where practical.
- Update internal import paths to use package-local relatives or the new alias instead of reaching back into `packages/editor`.
- Adjust `packages/editor/src/index.ts` and downstream consumers to import from `@8f4e/editor-state`.

### Step 4: Validate Build and Document Changes
- Run `npm run typecheck`, `npm test`, and `npm run build` to confirm the split is stable.
- Update relevant TODOs/docs (`todo/_index.md`, `docs/architecture.md`, etc.) to outline the new boundaries.
- Capture any follow-up tasks (e.g., additional state cleanup) as new TODOs if needed.

## Success Criteria

- [ ] `packages/editor-state` builds and publishes independently within the Nx workspace.
- [ ] No remaining deep imports into `packages/editor/src/**` from outside the package.
- [ ] Editor dev server and production builds run without runtime regressions.

## Affected Components

- `packages/editor` - Retains UI entry point; updates exports to rely on `@8f4e/editor-state`.
- `packages/editor-state` - New package housing state logic, reducers, effects, and selectors.
- `src/editor.ts` - Consumes the new package via alias instead of deep imports.

## Risks & Considerations

- **Risk 1**: Hidden cyclic dependencies between state files and UI adapters could surface during the move; mitigate by refactoring adapters into clear boundaries.
- **Risk 2**: Jest or Vite configs may miss the new package alias, causing build/test failures; mitigate by updating configs and adding smoke tests.
- **Dependencies**: Ensure existing state refactors (e.g., command queue, TODO 062) do not conflict with file moves.
- **Breaking Changes**: Potential API shifts if consumers rely on non-exported internals; document and provide migration guidance.

## Related Items

- **Blocks**: None.
- **Depends on**: `todo/025-separate-editor-view-layer.md`, `todo/026-separate-editor-user-interactions.md` (coordination with UI separation).
- **Related**: `todo/062-editor-command-queue-refactor.md`, `todo/033-editor-state-effects-testing.md`.

## References

- [Nx package configuration docs](https://nx.dev/recipes/other/adding-and-serving-react-applications#libraries)
- [Internal architecture notes](docs/architecture.md)
- [Vite alias setup](vite.config.mjs)

## Notes

- Aligns with the previously drafted plan to extract state logic for clearer boundaries and reuse.
- Coordinate with ongoing state testing improvements so expectations remain stable during the move.
- After migration, audit exports to enforce a minimal surface area for consumers.
