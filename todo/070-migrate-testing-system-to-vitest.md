---
title: 'TODO: Migrate testing system to Vitest'
priority: High
effort: 3-4 days
created: 2025-10-21
status: Open
completed: null
---

# TODO: Migrate testing system to Vitest

## Problem Description

The monorepo relies on Jest for unit and integration testing across Nx packages. Maintaining Jest alongside modern ESM toolchains has led to duplicated configuration (Jest + SWC + Vite), slower feedback loops, and inconsistent test ergonomics between packages. Vitest ships tighter integration with Vite/Nx builds, first-class ESM support, and aligns better with the runtime environment the editor uses. As the codebase expands, Jest's startup cost and config drift are slowing down contributors and discouraging test adoption.

## Proposed Solution

Adopt Vitest as the primary test runner across all packages.
- Keep the Nx test target but swap Jest executor for Vitest via `@nx/vite`.
- Reuse existing SWC transforms where necessary, but prefer Vitest's built-in esbuild pipeline.
- Provide compatibility shims for Jest globals (`jest.fn`, `expect` extensions) and migrate to Vitest equivalents.
- Update documentation, CI scripts, and developer tooling to reflect the new workflow.
- Evaluate incremental migration support (run both runners during transition) but plan to fully remove Jest once parity is achieved.

## Implementation Plan

### Step 1: Audit current Jest usage
- Inventory custom Jest config, setup files, mocks, and watch scripts across packages.
- Document blockers (e.g., reliance on Jest-specific APIs) and decide on Vitest-compatible alternatives.
- Dependencies: access to Nx project graph, align with maintainers on scope.

### Step 2: Introduce Vitest configuration
- Add root-level Vitest configuration shared via Nx, including coverage, environment, and alias setup.
- Configure `@nx/vite:test` executor for each package and wire into `npm run test`.
- Ensure test types build via TypeScript path aliases and Vite plugin resolution.

### Step 3: Migrate tests and tooling
- Update test utilities to use Vitest APIs, replacing remaining Jest globals.
- Adjust CI, lint-staged, and docs to run Vitest; remove Jest dependencies once parity achieved.
- Dependencies: successful dry runs of Vitest in representative packages (e.g., `packages/editor`, `packages/compiler`).

## Success Criteria

- [ ] `npm run test` executes Vitest across all packages via Nx without Jest installed.
- [ ] Test watch mode matches or improves current performance for core packages.
- [ ] CI pipelines and developer docs reflect Vitest usage with green builds.

## Affected Components

- `package.json` and workspace-level scripts — update test commands and dependencies.
- `nx.json`, `project.json` files under `packages/*` — change test targets to Vitest.
- `packages/editor`, `packages/compiler`, and shared testing utilities — migrate setup files and mocks.

## Risks & Considerations

- **Risk 1**: Vitest feature gaps (e.g., missing Jest matchers) could block migration; mitigate with `@vitest/expect` or third-party matcher packages.
- **Risk 2**: CI flakiness during transition due to configuration drift; mitigate by running Jest and Vitest in parallel for a short overlap period.
- **Dependencies**: Coordination with Nx tooling updates and ensuring Vite build aliases are accurate.
- **Breaking Changes**: Potential changes to test helper APIs; communicate and document migration steps for contributors.

## Related Items

- **Blocks**: n/a
- **Depends on**: Completing infrastructure cleanup in existing testing TODOs (`todo/032-editor-test-coverage-plan.md`, `todo/033-editor-state-effects-testing.md`) for context.
- **Related**: `todo/048-add-2d-engine-visual-regression-tests.md` (testing strategy alignment).

## References

- [Vitest documentation](https://vitest.dev/guide/)
- [Nx Vitest executor](https://nx.dev/packages/vite/executors/test)
- [Migration guide: Jest to Vitest](https://vitest.dev/guide/migrating-from-jest.html)

## Notes

- Track outstanding test API incompatibilities in a shared checklist.
- Consider enabling Vitest component testing for future UI coverage if Vite integration proves stable.
- Reassess coverage tooling (NYC vs. built-in coverage) during migration.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
