---
title: 'TODO: Split wasmUtils utilities into per-file modules and add in-source tests'
priority: Medium
effort: 1-2d
created: 2025-12-29
status: Completed
completed: 2025-12-29
---

# TODO: Split wasmUtils utilities into per-file modules and add in-source tests

## Problem Description

The compiler `wasmUtils` area groups many unrelated helpers into shared files, which makes ownership fuzzy and increases the cost of targeted changes. Tests for these helpers live under `packages/compiler/tests/wasmUtils/`, creating friction when iterating on utilities and encouraging broad test files rather than focused coverage. The utilities also lack consistent JSDoc, making intent and usage harder to follow.

## Proposed Solution

Split each utility in `packages/compiler/src/wasmUtils/` into its own module, then add in-source Vitest tests that live alongside each utility while removing the existing `.test.ts` files in `packages/compiler/tests/wasmUtils/`. Update exports and import paths to keep public APIs stable while making internal organization more modular. Add JSDoc comments to the new per-utility modules to clarify intent and usage. Use Vitest in-source testing patterns so utilities carry their tests close to implementation without creating additional test harness overhead.

## Implementation Plan

### Step 1: Audit wasmUtils utilities
- List current utility functions and categorize which should become standalone modules
- Identify any shared types/constants that need a central home

### Step 2: Split utilities into per-file modules
- Create one file per utility and update barrel exports
- Update compiler imports to new module paths
- Keep public re-exports stable to avoid widespread changes

### Step 3: Add in-source tests with Vitest
- Add in-source tests next to each utility module
- Ensure Vitest config includes in-source tests for compiler package
- Remove the existing `packages/compiler/tests/wasmUtils/*.test.ts` files as they migrate

### Step 4: Add JSDoc comments
- Add or expand JSDoc comments on each split utility module
- Align wording with compiler conventions and avoid inline implementation comments

## Success Criteria

- [ ] Each wasmUtils utility lives in its own file with clear naming
- [ ] Compiler builds without import regressions
- [ ] In-source Vitest tests cover the split utilities
- [ ] Existing wasmUtils `.test.ts` files are removed in favor of in-source tests
- [ ] JSDoc comments document intent and usage for each utility
- [ ] `nx test compiler` (or equivalent) passes

## Affected Components

- `packages/compiler/src/wasmUtils/` - split utilities into per-file modules
- `packages/compiler/src/index.ts` - re-exports if needed
- `packages/compiler/tests/wasmUtils/` - remove `.test.ts` files after migration

## Risks & Considerations

- **Churn risk**: Many import paths may need updates; minimize by keeping re-exports stable
- **Test discovery**: In-source tests require Vitest config support; confirm pattern before migration
- **Dependencies**: Ensure any shared constants/types remain centralized to avoid circular imports

## Related Items

- **Related**: `docs/todos/059-refactor-unit-tests-under-tests-folders.md`

## References

- `packages/compiler/src/wasmUtils/`
- `packages/compiler/tests/wasmUtils/`

## Notes

- Confirm which in-source testing pattern the compiler package prefers before converting all tests.
