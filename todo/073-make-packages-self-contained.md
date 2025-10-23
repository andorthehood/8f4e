---
title: 'TODO: Make Packages Self-Contained for Dist-First Usage'
priority: High
effort: 2-3d
created: 2025-10-23
status: Open
completed: null
---

# TODO: Make Packages Self-Contained for Dist-First Usage

## Problem Description

- Vite currently resolves workspace aliases to `src/` during dev via an `isBuild ? 'dist' : 'src'` conditional in `vite.config.mjs`.
- Packages emit TypeScript output into `dist/`, but dev tooling bypasses those artifacts, so `dist/` is often stale or missing when the Vite build runs.
- Nx lacks an orchestrated dev workflow, so dependent packages are not automatically rebuilt; editors must run multiple `tsc --watch` processes manually, causing drift and fragile DX.
- Result: production builds occasionally fail due to missing artifacts, caching is unreliable, and packages are not truly self-contained for consumers outside this repo.

## Proposed Solution

- Standardize every package on dist-first consumption by always resolving imports to compiled output.
- Shift build and watch responsibility from ad-hoc npm scripts to Nx executors so dependency graphs trigger rebuilds automatically.
- Introduce an Nx project for the Vite app that depends on upstream build/watch targets, ensuring `nx run app:dev` prepares the entire dependency tree.
- Remove the `isBuild` alias switch and rely solely on freshly emitted `dist/` directories in both dev and production.
- Consider `nx watch` as an alternative for local development if direct executor watch flags prove too noisy.
- Split test orchestration so unit tests and Playwright screenshot suites are callable via separate scripts, allowing CI (e.g., GitHub Actions) to skip the expensive screenshot run.

## Implementation Plan

### Step 1: Migrate Package Build Targets to Nx Executors
- Replace `nx:run-commands` + `tsc` invocations with `@nx/js:tsc` (and add `watch` configurations) across all packages.
- Expected outcome: Nx manages incremental builds, caches outputs, and offers `nx run <pkg>:dev` for watch mode.
- Dependencies or prerequisites: Validate each package’s `tsconfig` emits to `dist/` and exports align with new executor outputs.

### Step 2: Add Vite App Project with Dependency-Aware Dev Pipeline
- Create a root-level Nx project (e.g., `app`) running `@nx/vite:dev`/`build`, set `dependsOn: ['^dev']` and `['^build']` for dev/build respectively.
- Expected outcome: `nx run app:dev` spawns dependent package watchers before launching Vite; `nx run app:build` rebuilds required libs automatically.
- Dependencies or prerequisites: Ensure all dependent packages expose `dev`/`build` targets compatible with Nx task pipeline.

### Step 3: Update Tooling and Documentation
- Rewrite Vite aliases to point directly at `dist/`, update npm scripts to delegate to Nx (including separate commands for unit vs. screenshot tests), and document the new workflow in `README`/docs.
- Expected outcome: Single-source-of-truth scripts, `dist/` artifacts always fresh, and contributors understand the new DX.
- Dependencies or prerequisites: Step 1 and Step 2 complete; coordinate doc updates with any related TODOs.

## Success Criteria

- [ ] `nx run app:dev` rebuilds dependent packages automatically when editing their sources.
- [ ] `nx run app:build` succeeds without manual pre-build steps and produces working Vite output.
- [ ] Hot reload and production bundle both consume artifacts from `dist/` without alias hacks.
- [ ] Unit and screenshot test suites run via distinct commands so CI environments can pick the appropriate subset.

## Affected Components

- `vite.config.mjs` - Update alias resolution to dist-only paths.
- `package.json` - Align npm scripts with Nx-run dev/build commands.
- `packages/*/project.json` & `tsconfig.json` - Switch to Nx executors and ensure dist output consistency.
- `nx.json` / new Nx project definitions - Add app project and target defaults if required.
- `docs/` & `todo/_index.md` - Document workflow changes and track TODO status.

## Risks & Considerations

- **Risk 1**: Watch-mode builds may increase CPU usage; mitigate via selective `nx watch` usage or `--projects` scoping.
- **Risk 2**: Consumers relying on `src/` paths could break; audit local importers and add type-path fallbacks if needed.
- **Dependencies**: Stable Nx executors and consistent TypeScript build settings across packages.
- **Breaking Changes**: Potentially changes how non-Vite scripts reference packages; communicate in docs and release notes.

## Related Items

- **Blocks**: TODOs that split editor packages (025, 026) should wait until build pipeline is stable.
- **Depends on**: None currently identified.
- **Related**: 059 (test folder refactor) for ensuring watch targets honor new folder layout.

## References

- [Nx Vite serve guidance](https://nx.dev/recipes/vite/serve-and-build)
- [Nx watch dependent projects](https://nx.dev/concepts/task-pipeline#rebuilding-dependent-projects-while-developing-an-application)
- [Nx TypeScript executor docs](https://nx.dev/packages/js/executors/tsc)

## Notes

- Capture verification commands (`nx run <pkg>:dev`, `nx run app:dev`, etc.) during execution.
- Ensure `dist/` remains checked-in or ignored consistently across packages.
- Document fallback strategy if `watch` targets prove too heavy (e.g., `nx watch` recipes).
- Update log here as tasks progress.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
