---
title: 'TODO: Split compiler utils and use syntax helpers'
priority: Medium
effort: 1-2d
created: 2025-12-30
status: Completed
completed: 2025-12-31
---

# TODO: Split compiler utils and use syntax helpers

## Problem Description

Compiler utilities live in a single `utils.ts`, mixing unrelated helpers and making it harder to test, reuse, and evolve logic. Some syntax-related checks are implemented ad hoc (for example `name.startsWith('&')`) instead of relying on the shared syntax helpers, which can lead to drift and inconsistent behavior. There is also duplicated syntax logic (e.g., `getPointerDepth`) that already exists under `packages/compiler/src/syntax`.

## Proposed Solution

- Split `packages/compiler/src/utils.ts` into per-function modules under `packages/compiler/src/utils/`.
- Add in-source Vitest tests for each utility (mirroring the in-source test pattern used elsewhere in the repo).
- Replace syntax-specific logic inside compiler utilities with the appropriate helpers from `packages/compiler/src/syntax` (for example replace `name.startsWith('&')` with a syntax helper that expresses the rule).
- Replace local `getPointerDepth` usage with the syntax helper (`packages/compiler/src/syntax/memoryIdentifierHelpers.ts`) to remove duplication.

## Implementation Plan

### Step 1: Inventory and plan the split
- List every exported utility in `packages/compiler/src/utils.ts`.
- Decide target filenames and public exports.
- Identify which utilities include syntax-related logic that should be swapped to helpers.

### Step 2: Split utilities into per-file modules
- Move each utility into `packages/compiler/src/utils/<function-name>.ts`.
- Update exports to keep existing public API stable (barrel if needed).
- Keep changes minimal while preserving behavior.

### Step 3: Add in-source tests
- Add `if (import.meta.vitest)` blocks with `describe/it` for each utility.
- Cover at least one positive and one edge case per utility.

### Step 4: Replace syntax logic with helpers
- Use syntax helper utilities for syntax-specific checks.
- Remove any direct string prefix/suffix checks that belong to syntax rules.
- Replace usages in `packages/compiler/src/instructionCompilers/push.ts` to avoid local `startsWith`/`substring` logic when handling memory references and element identifiers.
- Verify existing call sites still compile and behavior matches expectations.

## Success Criteria

- [ ] `packages/compiler/src/utils.ts` is removed or reduced to a barrel that re-exports per-file modules.
- [ ] Each utility has in-source Vitest coverage.
- [ ] Syntax-related checks in utilities use `packages/compiler/src/syntax` helpers.
- [ ] `getPointerDepth` only exists in syntax helpers (no duplicate implementation in utils).
- [ ] `nx run compiler:test` passes.

## Affected Components

- `packages/compiler/src/utils.ts` - split into per-function files or converted to a barrel.
- `packages/compiler/src/utils/*` - new per-function utility modules.
- `packages/compiler/src/syntax/*` - consumed by utilities to enforce syntax rules.
- `packages/compiler/src/instructionCompilers/push.ts` - use syntax helpers instead of local string parsing.
- `packages/compiler/src/instructionCompilers/int.ts` - update `getPointerDepth` import if moved to syntax helper.
- `packages/compiler/src/instructionCompilers/float.ts` - update `getPointerDepth` import if moved to syntax helper.

## Risks & Considerations

- **Risk**: Changing exports could break imports in other packages.
- **Mitigation**: Preserve public exports via a barrel and update imports consistently.
- **Risk**: Syntax helper coverage gaps might surface differences in behavior.
- **Mitigation**: Add targeted tests to lock in expected behavior.
- **Dependencies**: Ensure `@8f4e/compiler/syntax` exports are stable before refactors.
- **Breaking Changes**: Avoid or document any public API changes; prefer compat re-exports.

## Related Items

- **Related**: `docs/todos/151-split-wasm-utils-and-add-in-source-tests.md`
- **Related**: `docs/todos/152-compiler-subpath-syntax-exports.md`

## Notes

- This should align with the in-source test approach used for compiler instruction tests.
- If any utilities are cross-package consumed, verify alias exports remain intact.
