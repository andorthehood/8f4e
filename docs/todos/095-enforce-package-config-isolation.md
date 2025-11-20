---
title: 'TODO: Enforce Package Config Isolation'
priority: High
effort: 2-3 days
created: 2025-11-20
status: Open
completed: null
---

# TODO: Enforce Package Config Isolation

## Problem Description

- Several package-level Vitest configs import the root `vitest.preset.ts`, violating the ADR that each package must be self-contained (e.g. `packages/editor/vitest.config.ts:5`, `packages/runtime-main-thread-logic/vitest.config.ts:3`, `packages/editor/packages/web-ui/vitest.config.ts:3`, etc.).
- Editor-side Vite configs (`packages/editor/vite.config.ts`, `packages/editor/packages/web-ui/screenshot-tests/vite.config.ts`, `packages/editor/packages/sprite-generator/screenshot-tests/vite.config.ts`) resolve sibling packages by walking outside the package directory, coupling builds to workspace layout instead of published artifacts.
- `packages/runtime-web-worker-logic/package-lock.json` pins `@8f4e/compiler` via `file:../compiler`, allowing the package to pull code from the workspace root.
- These cross-package reads break the isolation guarantees we want for packages, complicate publishing, and make it easy for hidden coupling to sneak in.

## Proposed Solution

- Duplicate or inline the necessary Vitest preset config directly inside each package’s `vitest.config.ts`, keeping only package-local values.
- Update Vite configs so they import dependencies via package entry points (`@8f4e/*` aliases or npm packages) rather than filesystem paths into sibling packages; optionally use build scripts to copy artifacts into a local `deps/` folder if needed.
- Regenerate `package-lock.json` entries (especially for runtime-web-worker-logic) so dependencies reference published versions instead of `file:` schemes reaching outside the package root.
- Add linting or Nx checks that flag new `../` references pointing out of `{projectRoot}` in config files.

## Implementation Plan

### Step 1: Snapshot Current Config Presets
- Capture the current settings exported from `vitest.preset.ts`.
- Create per-package copies (or generate via script) stored locally within each package.
- Expected outcome: every `vitest.config.ts` no longer imports from `../../..`.

### Step 2: Decouple Vite Config Aliases
- Replace `resolve(__dirname, '../compiler/dist')`-style aliasing with dependency imports (`import '@8f4e/compiler'`) or local copies staged inside the package.
- Update screenshot test configs to pull from package builds located inside the package itself (e.g., copy artifacts during build or publish to npm and consume from there).
- Expected outcome: no `resolve(__dirname, '../../..')` paths in package configs.

### Step 3: Normalize Package Dependency Declarations
- Reinstall dependencies so lockfiles reference registry versions (or tarballs stored inside the package) instead of `file:` references to siblings.
- Expected outcome: lockfiles remain self-contained and checks prevent regressions.

### Step 4: Verify Build/Test/Dev Workflows
- Run each package’s `build`, `dev`, and `test` targets (or the equivalent Nx run-many command) to ensure the isolation changes did not break local development.
- Expected outcome: `npm run build`, `npm run dev`, and `npm run test` (workspace root) succeed without cross-package references.

## Success Criteria

- [ ] No files under `packages/**` reference `vitest.preset.ts` or other root-level configs.
- [ ] No config/lockfile in `packages/**` contains `../` paths that escape `{projectRoot}`.
- [ ] CI check/script fails if future changes reintroduce cross-package filesystem access.

## Affected Components

- `packages/*/vitest.config.ts` — need local presets.
- `packages/editor/vite.config.ts`, `packages/editor/packages/*/screenshot-tests/vite.config.ts` — must consume dependencies via proper package entry points.
- `packages/runtime-web-worker-logic/package-lock.json` (and similar lockfiles) — ensure dependencies don’t use `file:` paths.

## Risks & Considerations

- **Risk**: Duplicated preset configs may drift; mitigate by documenting shared defaults or generating them via script.
- **Risk**: Consuming published packages might slow inner-loop dev; consider local npm tarball registry or Nx target that builds dependencies into a package-local `.deps` folder.
- **Dependencies**: Requires clarity on how packages obtain each other’s builds (publish vs. copy).
- **Breaking Changes**: Potential changes to import paths and build scripts; coordinate with CI before merging.

## Related Items

- **Depends on**: ADR enforcing package self-containment.
- **Related**: `docs/todos/091-optimize-dev-workflow-with-nx-caching.md` (ensuring tooling remains fast after isolation).

## References

- `vitest.preset.ts` (current shared config to decompose).
- `packages/editor/vite.config.ts` and screenshot Vite configs (examples of filesystem aliasing).
- ADR requiring packages to be self-contained and isolated.

## Notes

- Consider adding an Nx lint target that scans for `../` paths leaving `{projectRoot}` within configs.
- Once complete, move this TODO to `docs/todos/archived/` and update `_index.md`.
