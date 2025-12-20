---
title: 'TODO: Move Compiler Instruction Tests In-Source'
priority: Medium
effort: 1-2 days
created: 2025-12-20
status: Open
completed: null
---

# TODO: Move Compiler Instruction Tests In-Source

## Problem Description

Instruction compiler tests live under `packages/compiler/tests/instructions/*.test.ts`. The team wants to adopt Vitest in-source tests for instruction compilers so tests sit next to implementation and reduce cross-file drift.

## Proposed Solution

Move instruction tests into their corresponding files under `packages/compiler/src/instructionCompilers` using Vitest in-source blocks and move the instruction test helpers into `src` as well. Update Vitest config to include in-source tests and migrate snapshots to their new locations.

## Implementation Plan

### Step 1: Relocate instruction test utilities
- Move `packages/compiler/tests/instructions/testUtils.ts` to `packages/compiler/src/instructionCompilers/testUtils.ts`.
- Ensure helpers are only imported inside `if (import.meta.vitest)` to avoid production bundle impact.

### Step 2: Enable in-source tests for instruction compilers
- Update `packages/compiler/vitest.config.ts` to add `includeSource: ['src/instructionCompilers/**/*.ts']` while keeping the existing `tests/**/*.test.ts` include for other suites.

### Step 3: Migrate instruction tests
- For each instruction compiler file, embed the corresponding test cases using `import.meta.vitest`.
- Keep existing `moduleTester` / `moduleTesterWithFunctions` fixtures intact.

### Step 4: Move snapshots and clean up
- Update snapshots to the new `src/instructionCompilers/__snapshots__` location after running tests.
- Remove `packages/compiler/tests/instructions/*.test.ts` and the old snapshot directory once parity is confirmed.

## Success Criteria

- [ ] Instruction compiler tests execute via `npx nx run compiler:test`.
- [ ] Snapshots match after migration to in-source tests.
- [ ] No instruction tests remain under `packages/compiler/tests/instructions`.

## Affected Components

- `packages/compiler/src/instructionCompilers` - in-source tests and test utilities
- `packages/compiler/tests/instructions` - deprecated test location
- `packages/compiler/vitest.config.ts` - in-source include update

## Risks & Considerations

- **Snapshot churn**: snapshots move paths; expect updates and review carefully.
- **Config drift**: misconfigured `includeSource` could skip in-source tests.
- **Bundle leakage**: avoid importing test helpers outside `import.meta.vitest` blocks.

## Related Items

- **Related**: `docs/todos/059-move-unit-tests-under-tests-folders.md`
- **Related**: `docs/todos/115-editor-state-in-source-tests-and-vite-build.md`

## References

- `packages/compiler/tests/instructions`
- `packages/compiler/src/instructionCompilers`
- `packages/compiler/vitest.config.ts`

## Notes

- Keep any test helper exports unused in production builds.
- Update snapshot expectations immediately after migration to reduce noise later.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
