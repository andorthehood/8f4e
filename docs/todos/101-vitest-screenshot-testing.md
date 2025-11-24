title: 'TODO: Run Existing Screenshot-Based Visual Regression Tests with Vitest'
priority: Medium
effort: 1-2d
created: 2025-11-23
status: Open
completed: null
---

# TODO: Run Existing Screenshot-Based Visual Regression Tests with Vitest

## Problem Description

The current screenshot-based visual regression tests in the `web-ui` package currently assume Playwright as the primary tooling for screenshot capture and comparison.
However, the rest of the workspace is moving toward Vitest with first-class Vite integration, which creates a tooling split between unit/integration tests and visual regression tests.

This split has several drawbacks:
- Separate configuration and tooling (Playwright vs Vitest) increases maintenance overhead.
- Test utilities, fixtures, and mocking patterns are not shared across all test types.
- CI pipelines must orchestrate multiple test runners, slowing feedback and complicating caching.
- Developers have to switch mental models and tooling when adding or debugging tests.

We want existing screenshot/visual regression tests to be executed via Vitest so that visual tests align with the rest of the testing stack, without changing which visual scenarios are covered or requiring new visual tests to be written as part of this TODO.

## Proposed Solution

Use Vitest as the primary runner for the existing screenshot-based visual regression tests by:
- Evaluating browser/DOM environments compatible with Vitest (e.g., jsdom, @vitest/browser, or a headless browser bridge) that can host the current visual test harness.
- Adapting the existing screenshot utilities and baselines in the `web-ui` package so they can be invoked from Vitest without changing their coverage or behavior.
- Integrating the existing screenshot workflow into the Vitest configuration and Nx targets so developers use the same test runner for unit, integration, and visual tests.
- Phasing out any separate Jest/Playwright-only entrypoints for the current visual regression suite in favor of Vitest orchestration, where practical.
- Aligning with the official Vitest browser visual regression testing guide (including `toMatchScreenshot` and browser providers such as `@vitest/browser-playwright`) where it helps run the existing visual tests, not to define new ones.
 - Updating the workspace to use the latest compatible Vitest version so that browser and screenshot features are available and supported.

## Implementation Plan

### Step 1: Research Vitest-Compatible Visual Regression Approaches
- Survey existing libraries and patterns for screenshot testing with Vitest (including browser mode and external headless browsers).
- Review the official Vitest visual regression docs: https://vitest.dev/guide/browser/visual-regression-testing.html and capture recommended patterns (e.g., `toMatchScreenshot`, `tests/__screenshots__` directory conventions, reference/actual/diff outputs).
- Inventory the current screenshot-based visual regression tests in the `web-ui` package, including where baselines live and how screenshots are generated.
- Document trade-offs (performance, flakiness, CI compatibility, maintenance) for approaches that can host the existing tests under Vitest.
- Choose an approach that runs the existing visual regression suite under Vitest with minimal changes to test definitions and assets.

### Step 2: Run Existing Screenshot Tests Under Vitest
- Adapt one existing `web-ui` screenshot-based visual regression test (or small group of tests) to run under Vitest without changing its intent or coverage.
- Ensure baseline image generation and comparison logic remain the same, or are wrapped so that the baselines and thresholds do not need to be redefined.
- Verify that the migrated tests can be run locally via Nx (e.g., `nx test`) and integrate with the existing Vitest workspace config.
- Configure Vitest browser mode using a supported provider (for example `@vitest/browser-playwright` as shown in the Vitest docs), but restrict tests to a single browser (`chromium`) only to keep behavior deterministic.
- Use `expect(...).toMatchScreenshot()` and the recommended directory structure (e.g., `tests/__screenshots__/`) only as far as needed to support the existing tests, avoiding new scenarios or suites as part of this TODO.

### Step 3: Generalize Utilities and Optional CI Integration
- Extract or wrap existing screenshot helpers and fixtures into shared utilities under the `web-ui` package (or a dedicated testing utils package) so they can be called from Vitest.
- Ensure the current `web-ui` visual regression tests can be run locally via Nx (e.g., `nx test` or a dedicated `nx visual-test` target) using Vitest as the runner.
- Optionally provide a separate, opt-in CI job or manual workflow for running the existing visual regression tests when needed (e.g., pre-release checks), while avoiding running them on every CI push to control costs.
- Keep the existing baseline image directory structure where possible; if changes are needed to integrate with Vitest conventions (e.g., `tests/__screenshots__/`), migrate the baselines without expanding the test suite and consider using Git LFS for large screenshot suites as recommended by the Vitest docs.

### Step 4: Align Visual Regression Strategy with Vitest
- Ensure the broader `web-ui` visual regression strategy consistently assumes Vitest as the preferred runner for any current visual regression coverage.
- Keep coverage expansion and scenario design tracked in the appropriate visual regression planning documents, while this TODO remains focused on running the existing `web-ui` screenshot-based visual regression suite under Vitest.

## Success Criteria

- [ ] The existing screenshot-based visual regression tests for the `web-ui` package run under Vitest without reducing or expanding their coverage.
- [ ] `web-ui` visual regression tests can be invoked via Nx (e.g., `nx test` or a dedicated `nx visual-test` target) and run only against Chromium.
- [ ] Baseline images are stored and managed in a predictable directory structure (for example `tests/__screenshots__/...`) and are easy to update when intentional changes occur, without including platform-specific suffixes in filenames.
- [ ] CI configuration avoids running screenshot-based visual regression tests on every pipeline run by default, with any CI usage explicitly opt-in to control costs.
- [ ] No separate Jest/Playwright-only pipeline is required for running the existing visual regression tests unless explicitly justified.
 - [ ] The workspace uses the latest compatible Vitest version required for browser and screenshot testing features.

## Affected Components

- `packages/editor/packages/web-ui/` screenshot-based visual regression tests, helpers, and fixtures.
- Vitest configuration files:
  - `vitest.workspace.ts`
  - Package-level `vitest.config.ts` for the 2D engine.
- Nx test targets for the 2D engine (and any shared test-utils package).
- CI pipelines that orchestrate test runs.

## Risks & Considerations

- **Vitest Browser Support Maturity**: Vitest browser mode and integrations may evolve; APIs and best practices can change.
  - Mitigation: Keep visual regression helpers isolated and well-documented so they can adapt to tooling changes.
- **Flakiness in Visual Tests**: Timing, rendering differences, and environment differences can introduce flaky tests.
  - Mitigation: Use deterministic fixtures, control timing, and adopt tolerances for pixel comparisons where appropriate.
- **Performance Cost**: Screenshot tests are heavier than standard unit tests.
  - Mitigation: Run visual tests in a separate target/pipeline that is not part of the default CI run, and leverage Nx caching to avoid unnecessary reruns when they are executed.

## Related Items

- **Related**:
  - `docs/todos/032-editor-test-coverage-plan.md` (overall editor testing strategy).
  - `vitest.preset.ts`, `vitest.workspace.ts` (shared Vitest configuration).

## References

- Vitest visual regression testing guide: https://vitest.dev/guide/browser/visual-regression-testing.html
- Vitest documentation and browser mode references.
- Existing `web-ui` screenshot-based visual regression tests and any supporting harnesses.
- CI configuration for current Vitest runs.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section.
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context).
