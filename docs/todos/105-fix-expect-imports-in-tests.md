---
title: 'TODO: Fix expect imports and typings in tests'
priority: Medium
effort: 0.5-1d
created: 2025-11-27
status: Open
completed: null
---

# TODO: Fix expect imports and typings in tests

## Problem Description

Some test files use `expect`, `describe`, and related test globals without importing them or without being covered by the appropriate test typings, which leads to TypeScript errors in editors and during test typechecking.

Initial investigation shows:
- `packages/compiler/tests/**/*.test.ts` rely on Jest-style globals (`describe`, `test`, `expect`) with no imports.
- `packages/compiler/tsconfig.test.json` is configured with `types: ["vitest/globals", "node"]`, so Vitest provides typings for the globals but the tests are still written and run in a Jest style.
- Other packages (for example `packages/editor`) also rely on globals for `expect` instead of explicit imports, and editors can show "expect not found / not imported from vitest" errors when the test file is not picked up by the package `tsconfig.test.json`.

This mismatch between:
- how tests are written (Jest-style globals vs. Vitest-style globals vs. explicit imports), and
- which TypeScript configuration actually applies to the file in different tools (Nx, Vitest, IDE/tsserver)

causes confusing red squiggles and makes it unclear whether tests are correctly typed or just relying on implicit globals.

## Proposed Solution

Standardize on explicit imports for all test globals (`expect`, `describe`, `it`/`test`) across the workspace instead of relying on ambient globals.

High-level approach:
- For all Vitest-based packages:
  - Require explicit imports in every test file, e.g.:
    - `import { describe, it, expect } from 'vitest';`
  - Gradually disable `globals: true` in Vitest configs once the explicit imports migration is complete, so new tests do not accidentally rely on globals.
  - Keep `types: ["vitest/globals"]` in `tsconfig.test.json` only as long as needed during the migration; remove or trim once explicit imports are ubiquitous.
- For `packages/compiler`:
  - Migrate all tests from Jest to Vitest, updating each file to use explicit imports from `vitest`, aligning with archived TODO `070-migrate-testing-system-to-vitest` and `102-vitest-typecheck-tests`.
  - After migration, ensure Jest is no longer used in the compiler package; Jest should be reserved for the `glugglug` submodule only.
- Ensure that the tsconfigs used by IDEs and by Nx/Vitest typechecking include the correct `types` for the chosen runner, but do not rely on them for providing globals (they only provide typings for imported APIs).
- Clean up any remaining tests where `expect` (or other globals) are reported as missing by TypeScript by:
  - adding explicit imports from `vitest` / `@jest/globals`, and
  - removing legacy assumptions about globals as part of the migration.

## Implementation Plan

### Step 1: Audit test globals and tsconfig usage

- Enumerate all packages with tests (`packages/compiler`, `packages/editor`, runtimes, etc.).
- For each package, document:
  - Which test runner is used (Vitest vs Jest).
  - Whether tests rely on `globals: true` or explicit imports.
  - Which tsconfig (`tsconfig.json` vs `tsconfig.test.json`) IDEs and Nx/Vitest use for typechecking tests.

### Step 2: Decide and apply a consistent strategy per package

- For Vitest-based packages:
  - Update existing tests to use explicit imports from `vitest` instead of relying on globals.
  - Once all tests in a package are migrated, flip `globals: true` to `globals: false` in that package’s Vitest config.
  - Optionally simplify `tsconfig.test.json` by removing `vitest/globals` once there are no remaining global usages.
- For `packages/compiler`:
  - Migrate all tests to Vitest, updating them to import from `vitest` explicitly and switching the test runner away from Jest.
  - Remove Jest-specific configuration and dependencies from the compiler package once tests are running under Vitest.
  - Keep Jest usage confined to the `glugglug` submodule, which maintains its own Jest configuration.

### Step 3: Fix individual test files and tighten CI/IDE behavior

- Update test files that still trigger "expect not imported" or similar TS errors:
  - Add explicit imports where appropriate.
  - Move or rename tests so they are included by the relevant `include` patterns in `tsconfig.test.json`.
- Verify:
  - `npx nx run-many --target=test --all` passes.
  - Vitest typechecking (`test.typecheck`) is clean for Vitest-based projects.
  - IDEs (using the root `tsconfig.json` and package `tsconfig.test.json` files) no longer show spurious missing-global errors in tests.

## Success Criteria

- [ ] No test file in the workspace shows TypeScript errors about missing `expect`/`describe`/`it` when opened in a correctly configured IDE.
- [ ] Vitest typechecking for test files passes without relying on untyped or accidentally typed globals.
- [ ] Compiler tests have a clear, documented test runner and typings strategy (Vitest or Jest), with `expect` correctly typed either via globals or imports.

## Affected Components

- `packages/compiler` - Tests rely on Jest-style globals but are currently typed via `vitest/globals`; need a consistent runner + typings combination and potentially explicit imports.
- `packages/editor` - Vitest-based tests rely on globals and `vitest/globals`; may need explicit imports or better tsconfig coverage to avoid IDE errors.
- `packages/*` with tests - Any package whose tests are not covered by `tsconfig.test.json` or still rely on implicit globals will need updates.
- `packages/editor/packages/glugglug` - Remains on Jest with its own configuration; explicitly excluded from the Vitest migration except for ensuring explicit imports from `@jest/globals` where needed.
- `packages/editor` - Vitest-based tests rely on globals and `vitest/globals`; may need explicit imports or better tsconfig coverage to avoid IDE errors.
- `packages/*` with tests - Any package whose tests are not covered by `tsconfig.test.json` or still rely on implicit globals will need updates.

## Risks & Considerations

- **Mixed runners**: Compiler currently uses Jest while other packages use Vitest; migrating compiler tests to Vitest may uncover additional behavioral differences or require snapshot updates.
- **IDE configuration drift**: Some editors may still pick the wrong tsconfig for test files; documentation and possibly workspace settings may be needed to keep behavior consistent.
- **Breaking Changes**: Changing test runners or assertion libraries in the compiler may require adjusting snapshots and mocking patterns, which could be noisy in diffs.

## Related Items

- **Depends on / Related**:
  - `docs/todos/archived/070-migrate-testing-system-to-vitest.md`
  - `docs/todos/archived/100-typecheck-tests-without-including-in-bundles.md`
  - `docs/todos/archived/102-vitest-typecheck-tests.md`

## References

- Vitest documentation on globals and typechecking
- Jest documentation for `@jest/globals` and TypeScript setup
- Nx documentation for configuring per-project test and typecheck targets

## Notes

- This TODO is focused on aligning test typings and imports for `expect` and related globals; broader refactors to the test infrastructure should be tracked in separate TODOs if needed.
