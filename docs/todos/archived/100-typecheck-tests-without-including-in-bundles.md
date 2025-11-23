---
title: 'TODO: Typecheck Tests Without Including Them in Bundles'
priority: Medium
effort: 0.5-1 day
created: 2025-11-22
status: Cancelled
completed: null
---

# TODO: Typecheck Tests Without Including Them in Bundles

## Problem Description

The current TypeScript setup deliberately excludes test files from compilation:

- Root `tsconfig.json` excludes `src/**/*.test.ts` and only includes app entry and examples.
- Package-level `tsconfig.json` files (e.g., `packages/compiler/tsconfig.json`, `packages/editor/tsconfig.json`, runtime packages) all exclude `src/**/*.test.ts`.
- Nx `typecheck` targets (`nx run <project>:typecheck`) invoke `tsc`/`tsc --noEmit` against those configs, so tests are never part of the typecheck surface.
- Vitest is configured for running tests and coverage only, not for workspace-wide TS typechecking.

As a result:

- IDEs show type errors inside `*.test.ts` that do **not** fail CI or pre-commit hooks.
- `npm run typecheck` / `nx run-many --target=typecheck --all` give a green signal even when tests contain broken types.
- There is no consistent way to enforce type safety for tests across all packages.

We need a way to typecheck tests in CI and during development without including them in any build/bundle outputs.

## Proposed Solution

Introduce a dedicated TypeScript typecheck path for tests, separate from the build pipeline:

- Keep existing build `tsconfig.json` files as-is so bundles and declaration outputs never include tests.
- Add test-focused TypeScript configs that extend the build configs, flip `noEmit: true`, and adjust `include`/`exclude` to cover `*.test.ts` / `*.spec.ts` / `tests/**/*`.
- Add Nx targets (e.g., `typecheck-tests`) per project that run `tsc --noEmit --project tsconfig.tests.json` (or equivalent) and aggregate them via `nx run-many`.
- Wire a workspace-level command and CI step to run test typechecking alongside existing `typecheck`, plus an optional pre-commit hook for changed test files.

Alternative (if we want fewer configs):

- Introduce explicit `tsconfig.build.json` per package for `build`/emit, and let the main `tsconfig.json` be “typecheck everything (including tests)” with `noEmit: true`.
- Update Nx `build` targets to use `tsconfig.build.json` while `typecheck` uses the main config.

## Implementation Plan

### Step 1: Inventory Current Test Layout and Tsconfig Usage

- Enumerate test file patterns per package:
  - `packages/*/tests/**/*.test.ts`
  - `packages/*/src/**/*.test.ts`
  - Any `*.spec.ts` or other patterns used by Vitest configs.
- Confirm how each package’s `tsconfig.json` is used by `build` and `typecheck` targets (`project.json`).
- Validate that no current build step relies on test files being compiled.

### Step 2: Design Test Typecheck Configs

- For each package that has tests:
  - Add a `tsconfig.tests.json` (name TBD) that:
    - Extends the package `tsconfig.json`.
    - Sets or enforces `noEmit: true`.
    - Adjusts `include`/`exclude` to cover test files (e.g., `tests/**/*.test.ts`, `src/**/*.test.ts`).
  - Ensure the config **does not** alter the behavior of `tsconfig.json` used by `build`.
- For the root app:
  - Add a `tsconfig.tests.json` that extends `tsconfig.build.json` or `tsconfig.json`, and includes any app-level tests if/when added.

### Step 3: Add Nx Targets for Test Typechecking

- In each relevant `project.json`:
  - Add a `typecheck-tests` (or `test:typecheck`) target:
    - Executor: `nx:run-commands`.
    - Command: `tsc --noEmit --project tsconfig.tests.json`.
    - `cwd`: `{projectRoot}` (for packages) or `{workspaceRoot}` (for root app).
- In `nx.json`:
  - Optionally add `targetDefaults.typecheck-tests` mirroring `typecheck` defaults (inputs, caching).
- Verify:
  - `npx nx run <project>:typecheck-tests` works per package.
  - `npx nx run-many --target=typecheck-tests --all` runs cleanly when tests typecheck.

### Step 4: Integrate with Pre-Commit and CI

- Root `package.json` / `lint-staged`:
  - Add a script or command to typecheck tests for affected projects, e.g.:
    - `npx nx affected --target=typecheck-tests --base=origin/main` (or similar), or
    - `npx nx run-many --target=typecheck-tests --all` if affected-based is not needed initially.
- CI pipelines:
  - Add `npm run typecheck-tests` (or a combined `npm run typecheck:all`) to CI.
  - Ensure test typechecking runs after or alongside existing `typecheck`.

### Step 5: Document Workflow and Migration Notes

- Update `docs/nx-workflow.md` to describe:
  - New `typecheck-tests` target per project.
  - Workspace commands:
    - `npx nx run-many --target=typecheck-tests --all`
    - Any `npm run typecheck-tests` wrapper.
  - Behavior: tests are typechecked but never emitted/bundled.
- Add notes for contributors:
  - “If your tests don’t typecheck, CI will fail even if the editor/runner still builds.”
  - “When adding new test suites, update `tsconfig.tests.json` includes if necessary.”

## Success Criteria

- [ ] All TypeScript test files (`*.test.ts`, `*.spec.ts`, `tests/**/*`) are typechecked as part of CI.
- [ ] Build outputs and declaration bundles remain free of test code.
- [ ] `nx run-many --target=typecheck-tests --all` passes on a clean workspace.
- [ ] Pre-commit hook or local command exists to typecheck tests before pushing.
- [ ] IDE type errors in tests correspond to real CI failures (no “false green” typecheck runs).

## Affected Components

- Root app:
  - `tsconfig.json`, `tsconfig.build.json`, and new `tsconfig.tests.json`.
  - `project.json` `typecheck` target and new `typecheck-tests` target.
- Packages:
  - `packages/*/tsconfig.json` and new `packages/*/tsconfig.tests.json`.
  - `packages/*/project.json` `typecheck` and `typecheck-tests` targets.
- Tooling / CI:
  - `nx.json` target defaults (if extended).
  - Root `package.json` scripts / `lint-staged` config.
  - CI pipelines that currently call `npm run typecheck`.

## Risks & Considerations

- **Config Duplication**: Multiple `tsconfig*.json` files can drift over time.
  - Mitigation: Minimize overrides in `tsconfig.tests.json` (only `noEmit` and `include`/`exclude`), and document their purpose.
- **Longer CI Times**: Additional `tsc --noEmit` passes will increase CI duration.
  - Mitigation: Use Nx caching and/or `affected` runs to limit scope on incremental changes.
- **Pattern Mismatches**: Vitest test discovery patterns vs. TS `include` patterns can diverge.
  - Mitigation: Reuse or closely mirror patterns from `vitest.config.ts` and `vitest.preset.ts`.
- **Incremental Rollout**: Some packages may have failing test types initially.
  - Mitigation: Optionally start with a subset of projects or allow temporary `// @ts-expect-error` annotations where needed.

## Related Items

- **Related**:
  - `docs/todos/038-editor-types-testing.md` (type system test coverage).
  - `docs/postmortems/2025-11-05-netlify-build-typecheck-dependency.md` (typecheck pipeline behavior and dependencies).
  - `docs/todos/093-add-typecheck-github-action.md` (archived typecheck CI hook).

## References

- `tsconfig.json`, `tsconfig.build.json` in the repo root.
- Package-level `tsconfig.json` and `project.json` files under `packages/`.
- `nx.json` for `typecheck` target defaults and caching.
- `vitest.preset.ts`, `vitest.workspace.ts`, and per-package `vitest.config.ts` for test patterns.

## Notes

- This TODO is purely about **typechecking** tests, not about adding or restructuring test cases.
- A follow-up could add lint rules or scripts to enforce that each project with tests has a `typecheck-tests` target configured.
- If this proves too heavy, an alternative is to explore Vitest’s built-in typechecking or `ts-node` integration, but the initial approach keeps TS and test runners clearly separated.

