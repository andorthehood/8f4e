---
title: 'TODO: Add Sprite Generator Visual Regression Tests'
priority: Medium
effort: 1-2d
created: 2025-11-01
status: Open
completed: null
---

# TODO: Add Sprite Generator Visual Regression Tests

## Problem Description

The sprite generator currently relies on a manual `visual-testing` HTML page with no automated regression coverage. Rendering changes can slip through code review without pixel validation, breaking downstream consumers (e.g. editor canvas). Maintaining parity with the web-ui package is difficult because its Playwright harness and workflows are not shared, so sprite regressions go undetected until late testing.

## Proposed Solution

- Bootstrap a Playwright-driven screenshot suite for `@8f4e/sprite-generator`, mirroring the structure already in `web-ui/screenshot-tests`.
- Serve dedicated scenarios via a Vite dev server (distinct port) that consumes the built sprite-generator bundle and renders sprite sheets plus targeted components.
- Add Nx targets (`test:screenshot`, `test:screenshot:update`, optional `:ui`) so local developers and CI can run/update baselines consistently; document the workflow in the package README.
- Consider extracting shared utilities later if both packages converge on similar mocks, but prioritize getting sprite coverage in place first.

## Implementation Plan

### Step 1: Audit Existing Visual Test Harnesses
- Review `packages/editor/packages/web-ui/screenshot-tests` to catalog required configs, test server, snapshot storage, and Nx wiring.
- Capture reusable patterns (Playwright expect usage, Vite aliases) that can be adapted for the sprite generator.
- Dependency: none.

### Step 2: Stand Up Sprite Generator Screenshot Infrastructure
- Create `packages/editor/packages/sprite-generator/screenshot-tests` with Vite config (e.g. port 3002) and test cases built from the current `visual-testing` assets plus new targeted scenarios as needed.
- Write Playwright tests that load each scenario, wait for stable renders, and assert screenshots; seed baseline images.
- Dependency: ensure `nx run @8f4e/sprite-generator:build` runs prior to tests so aliases resolve to `dist/`.

### Step 3: Integrate Tooling and Documentation
- Add Nx targets mirroring the web-ui suite, update `package.json` scripts if helpful, and document the workflow in `packages/editor/packages/sprite-generator/README.md`.
- Run the suite locally to validate instructions, note follow-ups (CI integration, shared utilities) in README or notes.
- Dependency: Step 2 assets committed and passing locally.

## Success Criteria

- [ ] `nx run @8f4e/sprite-generator:test:screenshot` executes Playwright tests and passes against committed baselines.
- [ ] README includes clear steps for building prerequisites, running tests, and updating snapshots.
- [ ] Snapshot artifacts stored under `screenshot.test.ts-snapshots/` and verified locally prior to merge.

## Affected Components

- `packages/editor/packages/sprite-generator` - Gains screenshot harness, docs, Nx targets.
- `packages/editor/packages/sprite-generator/visual-testing` - Likely refactored into Playwright-compatible fixtures.
- `packages/editor/packages/web-ui/screenshot-tests` - Reference point; may contribute shared utilities in future.

## Risks & Considerations

- **Risk 1**: Port collision with existing visual tests (web-ui uses 3001); mitigate by reserving a unique port (e.g. 3002) and documenting it.
- **Risk 2**: Initial snapshots may drift if sprite assets change frequently; mitigate via clear README guidance and targeted test scenarios to minimize churn.
- **Dependencies**: Must build sprite-generator before running Playwright to ensure Vite aliases resolve.
- **Breaking Changes**: None expected for runtime consumers; test-only addition.

## Related Items

- **Related**: TODO 048 (Add 2D Engine Visual Regression Tests) – shares goal of expanding visual coverage.

## References

- [Playwright Screenshot Testing](https://playwright.dev/docs/test-snapshots)
- [Nx Documentation: Custom Targets](https://nx.dev/concepts/executors-and-configurations)

## Notes

- Consider extracting shared Playwright/Vite config helpers after both suites exist to reduce duplication.
- Confirm snapshot storage expectations with reviewers before merging baselines.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
