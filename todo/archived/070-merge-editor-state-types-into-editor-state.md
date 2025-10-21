---
title: 'TODO: Merge Editor State Types into Editor State Package'
priority: Medium
effort: 2-3d
created: 2025-10-21
status: Completed
completed: 2025-10-21
---

# TODO: Merge Editor State Types into Editor State Package

## Problem Description

The editor state type definitions live in a separate `@8f4e/editor-state-types` package while the runtime and mutator logic live in `@8f4e/editor-state`. This split forces every consumer (editor, web-ui, examples) to depend on an extra package, adds redundant configuration (tsconfig paths, Jest mappers, Vite aliases), and makes it harder to evolve the editor state because the value exports (`EMPTY_DEFAULT_PROJECT`, runtime factories, feature flag helpers) are fragmented. Keeping the packages separate also increases build steps and dependency churn without providing clear modular benefits.

## Proposed Solution

Consolidate `@8f4e/editor-state-types` back into `@8f4e/editor-state`:
- Move the source files (`types.ts`, `runtime.ts`, `featureFlags.ts`, `eventDispatcher.ts`, `index.ts`) into the editor-state package and fold them into existing modules.
- Merge overlapping helpers (feature flag utilities, runtime type exports) and update `editor-state` to re-export everything consumers need.
- Remove the standalone types package and update package manifests, alias configuration, and documentation to point to the unified entry point.

## Implementation Plan

### Step 1: Inventory and Target Layout
- Catalogue all exports and consumers of `@8f4e/editor-state-types`.
- Decide the new file layout within `packages/editor/packages/editor-state/src` (e.g., co-locate under `shared/` or merge into existing modules).

### Step 2: Inline Source Modules
- Copy the type and helper source files into the editor-state package and reconcile overlaps (feature flags already exist, runtime type exports, etc.).
- Update `editor-state` exports to expose the moved definitions and value constants.

### Step 3: Update Imports and Tooling
- Replace `@8f4e/editor-state-types` imports across the repository with the consolidated module.
- Update package dependencies, tsconfig path mappings, Jest moduleNameMapper entries, Vite aliases, and Nx project configs.
- Remove the old package directory after verifying no references remain.

### Step 4: Verification and Cleanup
- Run `npm run build`, `npm run typecheck`, and targeted Jest suites for editor/editor-state/web-ui.
- Update documentation (`todo/_index.md`, READMEs) to reflect the merged package.

## Success Criteria

- [ ] All consumers import shared state types and helpers from `@8f4e/editor-state`.
- [ ] Repository builds, type checks, and tests pass without the extra package.
- [ ] Redundant tooling configuration (aliases, path mappings) is removed.
- [ ] Documentation references the unified editor state module.

## Affected Components

- `packages/editor/packages/editor-state` – gains type definitions and helper modules.
- `packages/editor` – updates imports and dependency list.
- `packages/editor/packages/web-ui` – updates imports and tsconfig paths.
- `src/examples/**/*.ts` – updates module imports for example modules.
- `vite.config.mjs`, `packages/*/jest.config.js`, `tsconfig*.json` – tooling configuration cleanup.

## Risks & Considerations

- **Risk 1**: Introducing circular dependencies inside `editor-state` while merging modules. Mitigation: plan target layout and keep runtime helpers decoupled.
- **Risk 2**: Missing an import or config update leading to runtime build failures. Mitigation: comprehensive search-and-replace plus full build/typecheck run.
- **Dependencies**: Requires availability of existing editor-state tests/build pipeline for verification.
- **Breaking Changes**: External consumers must switch to the new module path; consider providing a compatibility re-export if needed.

## Related Items

- **Related**: `025-separate-editor-view-layer.md`, `026-separate-editor-user-interactions.md` – larger editor modularization efforts.
- **Related**: `069-extract-editor-state-package.md` – prior work that split state concerns.

## References

- `packages/editor/packages/editor-state-types/src` – current type definitions.
- `packages/editor/packages/editor-state/src` – target module for consolidated definitions.
- `todo/032-editor-test-coverage-plan.md` – testing considerations after refactor.

## Notes

- Ensure the merged package lists dependencies (`@8f4e/compiler`, `@8f4e/sprite-generator`, `glugglug`) formerly declared by the types package.
- Consider keeping a thin compatibility wrapper if downstream tooling still references the old package name.

## Archive Instructions

When this TODO is completed:
1. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
2. Update the `todo/_index.md` file to move the entry to the "Completed TODOs" section and record the completion date.
