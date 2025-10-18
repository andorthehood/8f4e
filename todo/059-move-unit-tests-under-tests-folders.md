# TODO: Refactor unit tests into __tests__ folders

**Priority**: 🟡
**Estimated Effort**: 0.5–1 day
**Created**: 2025-09-04
**Status**: Open
**Completed**: 

## Problem Description

Current unit tests are not consistently organized. Some are co-located with source files, others may live in ad-hoc directories. This makes discovery harder, complicates refactors, and creates ambiguity for where new tests should go.

- Inconsistent locations for unit tests reduce discoverability and cohesion.
- Refactors are noisier when test placement isn’t standardized.
- New contributors lack a clear convention for adding tests.

## Proposed Solution

Adopt a consistent structure placing unit tests under `__tests__` folders aligned with the feature directories inside `src/`.

- Unit tests live at: `packages/<pkg>/src/**/__tests__/*.test.ts`.
- Snapshots live adjacent in `__snapshots__/`.
- Test fixtures live in `__fixtures__/` under the same `__tests__` directory.
- Package-level integration tests will remain (or be moved) to `packages/<pkg>/__tests__/*.spec.ts` and are out of scope for this refactor unless clearly miscategorized.

## Implementation Plan

### Step 1: Inventory current tests
- Command: `rg -n --glob '!node_modules' '(\\.test\\.ts|\\.spec\\.ts)$'`
- Output a checklist of files to move and classify unit vs integration.

### Step 2: Decide unit vs integration per file
- Criteria: unit tests target a single module/file or small cluster; integration spans multiple modules or public API.
- Mark unit tests to be moved under `src/**/__tests__`.

### Step 3: Map destination paths
- For each unit test at `packages/<pkg>/src/path/foo.test.ts` (or similar), destination is `packages/<pkg>/src/path/__tests__/foo.test.ts`.
- If a directory lacks `__tests__`, create it.

### Step 4: Move unit tests
- Use `git mv` to preserve history.
- Example: `git mv packages/<pkg>/src/path/foo.test.ts packages/<pkg>/src/path/__tests__/foo.test.ts`.
- Normalize names to `*.test.ts` for unit tests.

### Step 5: Move related snapshots and fixtures
- If `__snapshots__/foo.test.ts.snap` exists, move alongside the new test path under `__tests__/__snapshots__/`.
- Move or create `__fixtures__/` next to the test as needed.

### Step 6: Adjust imports/mocks if paths changed
- Update relative imports due to the extra `__tests__` nesting layer.
- For Jest manual mocks:
  - Keep auto-resolved mocks as `src/**/__mocks__/*` when mocking sibling modules.
  - If mocks live under `__tests__/__mocks__`, reference them explicitly in `jest.mock()`.

### Step 7: Ensure configs support new layout
- Jest `testMatch` must include: `**/__tests__/**/*.(test|spec).ts`.
- Coverage excludes `__tests__`, `__fixtures__`, `__mocks__`, and `dist`.
- Each package `tsconfig.spec.json` includes: `src/**/__tests__/**/*.ts` and sets `types: ['jest', 'node']`.

### Step 8: Validate per package
- Run: `npm run test -w packages/<pkg>`.
- Fix import paths, environment (`jsdom` vs `node`), and snapshot locations as needed.

### Step 9: Validate repo-wide
- Run: `npm test`.
- If behavior unchanged but snapshots moved, update snapshots: `npm test -- -u` (package-by-package).

### Step 10: Documentation and PR
- Briefly document the convention in `docs/` or reference repo Testing Guidelines.
- Summarize moves and any config changes in the PR description.

## Success Criteria

- [ ] All unit tests reside under `packages/<pkg>/src/**/__tests__/*.test.ts`.
- [ ] Snapshots reside under `__tests__/__snapshots__/` next to their tests.
- [ ] Test fixtures live in `__tests__/__fixtures__/` or are removed if obsolete.
- [ ] All packages’ tests pass locally via `npm test`.
- [ ] Jest and TS configs recognize the new structure without warnings.

## Affected Components

- `packages/editor` – move unit tests to `src/**/__tests__`.
- `packages/compiler` – same as above.
- `packages/editor/packages/glugglug` – same as above.
- `packages/editor/packages/sprite-generator` – same as above.
- `packages/runtime-*` and `packages/audio-worklet-runtime` – same as above where unit tests exist.
- Root app `src/` – if any unit tests exist, move to `src/**/__tests__`.

## Risks & Considerations

- Import path adjustments: moving tests one directory deeper changes relative imports.
- Jest manual mocks: auto-resolve requires `__mocks__` adjacent to modules (not under `__tests__`).
- Snapshot paths: moving tests can invalidate snapshot locations; update snapshots intentionally if needed.
- CI config: ensure any CI scripts rely on `npm test` and not hard-coded glob patterns.

## Related Items

- 032-editor-test-coverage-plan.md
- 033-editor-state-effects-testing.md
- 034-editor-events-testing.md
- 035-editor-midi-testing-completion.md
- 036-editor-config-testing-completion.md
- 037-editor-integration-testing-expansion.md
- 038-editor-types-testing.md
- 039-editor-test-utilities.md

## References

- Jest: project structure and snapshot docs
- Repo Testing Guidelines (root README/guidelines)

## Notes

- Keep integration tests under `packages/<pkg>/__tests__/` as a separate follow-up if needed.
- Prefer alias imports `@8f4e/<pkg>` in tests when practical; use relative paths for fixtures.

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
