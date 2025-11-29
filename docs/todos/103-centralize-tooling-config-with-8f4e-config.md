---
title: 'TODO: Centralize tooling config with @8f4e/config'
priority: Medium
effort: 1-2 days
created: 2025-11-24
status: Completed
completed: 2025-11-29
---

# TODO: Centralize tooling config with @8f4e/config

## Problem Description

The workspace currently has heavily duplicated tooling configuration across packages:
- Multiple `tsconfig.json` files repeat the same compiler options (module, moduleResolution, strictness, outDir/rootDir, declaration/sourceMap, etc.) with small variations in `lib` and includes.
- `vitest.config.ts` files across packages re-declare similar `test` and `coverage` blocks, only differing in environment (`node` vs `jsdom`), include patterns, and a few extra excludes/aliases.
- Vite library configs have a lot of overlap in their `build.lib` setup (entry, formats, outDir, rollupOptions, minify/sourcemap).
- ESLint rules and Prettier settings are defined at the root, but packages are not self-contained and cannot easily carry their own config without copying rules.

This redundancy makes it harder to:
- Evolve shared conventions consistently (e.g., changing TS strictness or coverage defaults in one place).
- Reason about how a given package is configured without scanning multiple similar files.
- Move a package into another repo or context while preserving consistent tooling behavior.

## Proposed Solution

Introduce a single `@8f4e/config` package that centralizes the workspace's tooling configuration while keeping packages self-contained:
- `@8f4e/config/ts`: Provides base/app/lib/test TypeScript configurations or helpers that capture the common compiler options, with small variants for `lib` (DOM, webworker, etc.) and usage patterns.
- `@8f4e/config/vitest`: Exposes factory helpers for Vitest configs (e.g., `createNodePreset`, `createJsdomPreset`) that set shared `test` and `coverage` defaults, allowing packages to customize only environment, include patterns, and aliases.
- `@8f4e/config/vite`: Offers helpers to build Vite configs for library bundles and screenshot/dev setups, defining consistent `build.lib` options, targets, and rollup settings.
- `@8f4e/config/eslint`: Contains the shared ESLint rules and Prettier settings, so both root and per-package ESLint configs can import from one place.

Important constraints:
- Use a single `@8f4e/config` package with internal entrypoints instead of multiple `@8f4e/config-*` packages to avoid juggling multiple versions.
- Jest usage (e.g. in glugglug) is considered deprecated and will be migrated to Vitest; no dedicated Jest config will be added to `@8f4e/config`.

Packages remain self-contained by keeping thin local config entrypoints (e.g. `tsconfig.json`, `vitest.config.ts`, `vite.config.ts`, ESLint config) that import from `@8f4e/config` via `node_modules` instead of repo-relative paths. Only **shared/common defaults** should live in `@8f4e/config`; any package-specific behavior (custom aliases, environment tweaks, include/exclude patterns, etc.) should continue to reside in each package's own config wrapper.

## Implementation Plan

### Step 1: Design @8f4e/config API surface
- Define the public entrypoints for `@8f4e/config/ts`, `/vitest`, `/vite`, and `/eslint`.
- Decide whether each entrypoint returns JSON-like objects, factory functions, or pre-configured config objects suitable for spreading into tool configs.
- Document how packages should consume these entrypoints in new or existing configs.

### Step 2: Implement shared TS config helpers
- Extract common TS compiler options from existing `tsconfig.json` files into `@8f4e/config/ts`.
- Provide variants for DOM, webworker, and pure library environments, as well as any app-specific patterns.
- Update a small set of representative packages to consume the shared TS configs via local `tsconfig.json` wrappers.

### Step 3: Implement shared Vitest config helpers
- Move the shared Vitest defaults (currently in individual `vitest.config.ts` files and `vitest.preset.ts`) into `@8f4e/config/vitest`.
- Provide helpers (e.g. `createNodePreset`, `createJsdomPreset`) that set test/coverage defaults while allowing package-level overrides.
- Update package-level Vitest configs to use the shared helpers and keep only their specific differences (environment, include patterns, aliases).

### Step 4: Implement shared Vite config helpers
- Identify common patterns between Vite configs (lib bundle configs and screenshot/dev configs).
- Create `@8f4e/config/vite` helpers that standardize `build.lib`, targets, rollupOptions, and other shared settings.
- Update a few Vite configs to use the new helpers, ensuring the API covers both library bundles and screenshot/dev use cases.

### Step 5: Implement shared ESLint config and integrate
- Extract root ESLint rules and Prettier settings into `@8f4e/config/eslint`.
- Update the root ESLint config to import from `@8f4e/config/eslint`.
- Optionally add per-package ESLint entrypoints that import from `@8f4e/config/eslint` to make packages more self-contained.

### Step 6: Consolidate, document, and clean up
- Update `docs/brainstorming_notes/010-config-packages-and-self-contained-packages.md` if necessary to reflect the final implemented shape.
- Add concise documentation (e.g. in `docs/` or a README inside `@8f4e/config`) describing how new packages should use the shared config.
- Remove or simplify any now-redundant config duplication that is fully covered by `@8f4e/config`.

## Success Criteria

- [ ] Most package `tsconfig.json` files delegate their common options to `@8f4e/config/ts`, with only small, package-specific differences.
- [x] Most `vitest.config.ts` files use helpers from `@8f4e/config/vitest`, and updating defaults (coverage, timeouts, reporters) can be done centrally.
- [x] Vite library and screenshot/dev configs share helpers from `@8f4e/config/vite`, reducing boilerplate and keeping build behavior consistent.
- [x] ESLint rules and Prettier options are defined in `@8f4e/config/eslint` and consumed by the root (and optionally per-package) configs.
- [x] No new Jest configuration is added; Vitest is the default test runner for new work.

## Affected Components

- `@8f4e/config` (new package) - centralizes TypeScript, Vitest, Vite, and ESLint configuration.
- Existing packages under `packages/*` - their `tsconfig.json`, `vitest.config.ts`, and `vite.config.*` files will be updated to consume shared helpers.
- Root tooling files (`tsconfig.json`, `tsconfig.build.json`, `vitest.preset.ts`, `vitest.workspace.ts`, `.eslintrc.js`, `vite.config.mjs`) - will be adapted to use `@8f4e/config` where appropriate.

## Risks & Considerations

- **Indirection when debugging**: Developers will sometimes need to inspect `@8f4e/config` to understand a given tool's behavior. Mitigate with clear documentation and small, composable helpers.
- **Incremental rollout complexity**: Migrating all packages at once might be disruptive. Consider an incremental rollout where a subset of packages adopt `@8f4e/config` first.
- **Nx and tooling integration**: Ensure that Nx tasks and editor tooling (TS server, ESLint integration, Vitest/Vite runners) continue to pick up configs correctly when they import from `@8f4e/config`.
- **Breaking changes**: Centralizing configs may change behavior (e.g. stricter TS options or coverage defaults). Plan for a coordinated update and communicate changes to contributors.

## Related Items

- **Related**: `docs/brainstorming_notes/010-config-packages-and-self-contained-packages.md` (design and reasoning for config centralization and self-contained packages).
- **Related**: `docs/todos/091-optimize-dev-workflow-with-nx-caching.md` (both aim to improve developer experience and tooling coherence across the workspace).

## References

- Internal: `vitest.preset.ts`, `vitest.workspace.ts`, and existing `vitest.config.ts` files under `packages/*`.
- Internal: `tsconfig.json`, `tsconfig.build.json`, and per-package `tsconfig.json` files under `packages/*`.
- Internal: `vite.config.mjs` at the root and package Vite configs under `packages/*`.

## Notes

- This TODO is driven by the desire to keep packages self-contained while avoiding heavy configuration duplication.
- A single `@8f4e/config` package with multiple entrypoints is preferred over many small config packages to keep version management simple.
