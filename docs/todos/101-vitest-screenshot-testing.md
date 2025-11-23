---
title: 'TODO: Use Vitest for Screenshot-Based Visual Regression Testing'
priority: Medium
effort: 1-2d
created: 2025-11-23
status: Open
completed: null
---

# TODO: Use Vitest for Screenshot-Based Visual Regression Testing

## Problem Description

The current plan for visual regression testing in the 2D engine (see TODO-048) assumes Jest + Puppeteer or Playwright as the primary tooling for screenshot capture and comparison.
However, the rest of the workspace is moving toward Vitest with first-class Vite integration, which creates a tooling split between unit/integration tests and visual regression tests.

This split has several drawbacks:
- Separate configuration and tooling (Jest/Playwright vs Vitest) increases maintenance overhead.
- Test utilities, fixtures, and mocking patterns are not shared across all test types.
- CI pipelines must orchestrate multiple test runners, slowing feedback and complicating caching.
- Developers have to switch mental models and tooling when adding or debugging tests.

We want to explore and adopt a Vitest-based approach for screenshot/visual regression testing so that visual tests align with the rest of the testing stack.

## Proposed Solution

Adopt Vitest as the primary runner for screenshot-based visual regression tests by:
- Evaluating browser/DOM environments compatible with Vitest (e.g., jsdom, @vitest/browser, or a headless browser bridge).
- Implementing a reusable screenshot utility that:
  - Renders 2D engine scenes in a controlled environment.
  - Captures rendered frames to image buffers.
  - Compares screenshots against stored baselines with configurable tolerances.
- Integrating the screenshot workflow into the existing Vitest configuration and Nx targets.
- Phasing out any separate Jest/Playwright-only visual regression stack in favor of a unified Vitest approach, where practical.
- Aligning with the official Vitest browser visual regression testing guide (including `toMatchScreenshot` and browser providers such as `@vitest/browser-playwright`) where it fits the 2D engine use cases.

## Implementation Plan

### Step 1: Research Vitest-Compatible Visual Regression Approaches
- Survey existing libraries and patterns for screenshot testing with Vitest (including browser mode and external headless browsers).
- Review the official Vitest visual regression docs: https://vitest.dev/guide/browser/visual-regression-testing.html and capture recommended patterns (e.g., `toMatchScreenshot`, `tests/__screenshots__` directory conventions, reference/actual/diff outputs).
- Document trade-offs (performance, flakiness, CI compatibility, maintenance).
- Choose an initial approach that fits the 2D engine use cases and Nx/Vite setup.

### Step 2: Prototype Vitest Screenshot Tests for the 2D Engine
- Add a minimal Vitest-powered visual regression prototype for one or two simple 2D engine scenes.
- Implement baseline image generation and comparison logic with configurable thresholds.
- Verify that tests can be run locally via Nx (e.g., `nx test`) and integrate with the existing Vitest workspace config.
- Configure Vitest browser mode using a supported provider (for example `@vitest/browser-playwright` as shown in the Vitest docs), but restrict tests to a single browser (`chromium`) only.
- Use `expect(...).toMatchScreenshot()` so that reference, actual, and diff images are generated in a predictable structure (e.g., under `tests/__screenshots__/`), and adjust naming conventions so that filenames do not encode the host platform (OS) since the rendering pipeline is fully controlled and should be pixel-identical across environments.

### Step 3: Generalize Utilities and Optional CI Integration
- Extract screenshot helpers and fixtures into shared utilities under the 2D engine package (or a dedicated testing utils package).
- Ensure visual regression tests can be run locally via Nx (e.g., a dedicated `nx visual-test` target) without being part of the default CI pipeline.
- Optionally provide a separate, opt-in CI job or manual workflow for running visual regression tests when needed (e.g., pre-release checks), while avoiding running them on every CI push to control costs.
- Decide how to store and version-control baseline images (e.g., under `tests/fixtures/visual/` or `tests/__screenshots__/`), and consider using Git LFS for large screenshot suites as recommended by the Vitest docs.

### Step 4: Align TODO-048 with Vitest Strategy
- Update TODO-048 (Add 2D Engine Visual Regression Tests) to reference the chosen Vitest-based approach instead of Jest/Playwright, or mark this TODO as the preferred implementation path.
- Remove or de-prioritize plans that assume a separate Jest/Playwright stack once Vitest-based visual regression is proven.

## Success Criteria

- [ ] Screenshot-based visual regression tests for the 2D engine run under Vitest.
- [ ] Visual regression tests can be invoked via Nx (e.g., `nx test` or a dedicated `nx visual-test` target) and run only against Chromium.
- [ ] Baseline images are stored and managed in a predictable directory structure (for example `tests/__screenshots__/...`) and are easy to update when intentional changes occur, without including platform-specific suffixes in filenames.
- [ ] CI configuration avoids running screenshot-based visual regression tests on every pipeline run by default, with any CI usage explicitly opt-in to control costs.
- [ ] No separate Jest/Playwright-only pipeline is required for visual regression tests unless explicitly justified.

## Affected Components

- `packages/editor/packages/glugglug/` (2D engine) testing setup and fixtures.
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

- **Depends on**:
  - `docs/todos/048-add-2d-engine-visual-regression-tests.md` (overall visual regression plan for 2D engine).
- **Related**:
  - `docs/todos/032-editor-test-coverage-plan.md` (overall editor testing strategy).
  - `vitest.preset.ts`, `vitest.workspace.ts` (shared Vitest configuration).

## References

- Vitest visual regression testing guide: https://vitest.dev/guide/browser/visual-regression-testing.html
- Vitest documentation and browser mode references.
- Existing 2D engine visual regression TODO and any prototypes under `packages/editor/packages/glugglug/`.
- CI configuration for current Vitest runs.

## Notes

- This TODO focuses on **how** visual regression tests are implemented (Vitest-based) rather than **what** scenarios are covered; TODO-048 remains the source of truth for coverage scope.
- If Vitest-based screenshot testing proves impractical for some scenarios, a hybrid approach (Vitest + external headless browser) may still be acceptable, but should be documented clearly.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section.
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context).
