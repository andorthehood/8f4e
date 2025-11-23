---
title: 'TODO: Use Vitest for Test Typechecking'
priority: Medium
effort: 0.5-1d
created: 2025-11-23
status: Open
completed: null
---

# TODO: Use Vitest for Test Typechecking

## Problem Description

Currently, test files are not consistently included in the main TypeScript typecheck pipeline, which can lead to:
- Type errors in tests being silently ignored by CI and local scripts.
- Drift between how application code and test code are typechecked.
- Surprises where IDEs show red squiggles in tests, but `npm run typecheck` still passes.

There is interest in leveraging Vitest itself to enforce type safety for test files so that:
- The tooling surface stays smaller (Vitest as both test runner and typecheck gate for tests).
- Test discovery patterns and typecheck coverage naturally stay aligned.
- Contributors can rely on a single, familiar command (`nx test` or `npm test`) to catch both runtime and type errors in tests.

We need a clear plan to evaluate and, if feasible, adopt Vitest-based typechecking for test files across the workspace, while keeping build output free of test code.

## Proposed Solution

Integrate typechecking for test files into the Vitest workflow by:
- Investigating Vitest options and patterns that enforce TypeScript typechecking for test files (e.g., `typecheck` support, `tsconfig` integration, or dedicated mode/flag).
- Ensuring that the Vitest configuration used for tests includes relevant TS options (strictness, path aliases, DOM/lib settings).
- Updating Nx targets and root scripts so that running tests as part of CI also implies typechecking test files.

## Implementation Plan

### Step 1: Research Vitest Typechecking Capabilities
- Document current Vitest options for TypeScript typechecking of test files (including any beta/experimental features).
- Identify whether typechecking can happen:
  - As part of a standard `vitest` run.
  - Via a dedicated `vitest typecheck` or similar mode.
  - Or by reusing Vitest’s config in a wrapper that calls `tsc` with the right project settings.

### Step 2: Prototype Vitest-Based Typechecking in One Package
- Choose a representative package (e.g., `@8f4e/editor`) with a non-trivial test suite.
- Configure Vitest so that running tests also enforces TS typechecking for test files.
- Introduce deliberate type errors in a throwaway branch to confirm that Vitest fails appropriately.

### Step 3: Roll Out Across Workspace and CI
- Apply the chosen pattern to all packages with tests, ensuring:
  - Test files (`*.test.ts`, `*.spec.ts`, `**/__tests__/**`) are included in typechecking.
  - Test-only dependencies (e.g., Vitest globals) are available in the TS environment.
- Update Nx targets and root scripts so that:
  - CI runs a command that both executes tests and typechecks them.
  - Local workflows (e.g., `npm test`, `nx test`) provide consistent typecheck behavior.

## Success Criteria

- [ ] All TypeScript test files are typechecked as part of running tests (locally and in CI).
- [ ] No separate `tsc` invocation is required solely to typecheck tests, unless explicitly chosen.
- [ ] Vitest failures include type errors in tests, not just runtime assertion failures.
- [ ] The approach does not include test files in production bundles or type declaration outputs.
- [ ] Developer and CI workflows remain simple (no extra commands needed to ensure test type safety).

## Affected Components

- Vitest configuration:
  - `vitest.workspace.ts`
  - Per-package `vitest.config.ts` files.
- Nx test and typecheck targets in `project.json` for packages with tests.
- Root `package.json` scripts and any CI configuration that run tests or typechecks.
- Documentation describing how to run tests and typechecks locally.

## Risks & Considerations

- **Vitest Feature Maturity**: Some typechecking options may be experimental or change over time.
  - Mitigation: Keep configuration centralized and documented; be prepared to adjust as Vitest evolves.
  - **Performance Impact**: Combining test execution and typechecking may increase test run times.
  - Mitigation: Use Nx caching, and consider separate “fast tests” vs “full tests with typecheck” targets if necessary.

## Related Items

- **Related**:
  - `docs/todos/032-editor-test-coverage-plan.md` (overall testing strategy).
  - `vitest.preset.ts`, `vitest.workspace.ts` for shared Vitest setup.

## References

- Vitest documentation for TypeScript integration and any `typecheck` mode/flags.
- Existing Nx + Vitest configuration in this workspace.
- CI pipelines that currently orchestrate `npm run test` and `npm run typecheck`.

## Notes

- This TODO focuses specifically on **using Vitest** as the primary interface for typechecking tests; it does not mandate how TypeScript is invoked under the hood, as long as developers experience a consistent Vitest-based workflow.
- If Vitest-based typechecking proves too slow or fragile, fallback or hybrid strategies should be documented, and this TODO may be adjusted accordingly.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section.
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context).
