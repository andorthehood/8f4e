---
title: 'TODO: Skip reapplying compiled config when unchanged'
priority: Medium
effort: 1-2 days
created: 2026-01-22
status: Completed
completed: 2026-01-22
---

# TODO: Skip reapplying compiled config when unchanged

## Problem Description

After editing config blocks, the compiler always re-applies compiled config into the store. Even if the compiled config output is identical, this still triggers store updates, downstream recomputations, and potential re-renders. This adds unnecessary work and can cause subtle cascaded recalculations.

## Proposed Solution

Add a deterministic deep-equality check for the compiled config output **after defaults are merged**. If the new config is deep-equal to the current state value, **do not call** `store.set` for the compiled config. Always update error arrays when they change.

## Implementation Plan

### Step 1: Add a deep-equal helper
- Implement a lightweight deep-equality function in `packages/editor/packages/editor-state/src/features/config-compiler/utils/deepEqual.ts`.
- It should compare plain objects, arrays, primitives, and handle `null`/`undefined`.

### Step 2: Apply diffing in config effects
- **Project config**: after merging defaults, compare to `state.compiledProjectConfig`. If equal, skip `store.set('compiledProjectConfig', ...)`.
- **Editor config**: after merging defaults, compare to `state.compiledEditorConfig`. If equal, skip `store.set('compiledEditorConfig', ...)`.
- Error arrays (`projectConfigErrors`, `editorConfigErrors`) should still be updated when they differ.

### Step 3: Tests
- Add tests for both project and editor config effects that assert `store.set` is **not** called for compiled config when the output is unchanged.
- Add tests that verify error arrays are still updated when errors change.

## Success Criteria

- [ ] `compiledProjectConfig` is not set when deep-equal to existing value
- [ ] `compiledEditorConfig` is not set when deep-equal to existing value
- [ ] Error arrays are updated only when their contents change
- [ ] Tests cover unchanged-config behavior for both project and editor configs

## Affected Components

- `packages/editor/packages/editor-state/src/features/project-config/effect.ts` - project config application
- `packages/editor/packages/editor-state/src/features/editor-config/effect.ts` - editor config application
- `packages/editor/packages/editor-state/src/features/config-compiler/utils/*` - optional shared diff helper

## Risks & Considerations

- **Risk 1**: Incorrect equality checks could suppress legitimate updates. Mitigate with tests.
- **Risk 2**: Deep comparison cost for large configs. Acceptable for current config sizes.
- **Dependencies**: None.
- **Breaking Changes**: None expected.

## Related Items

- **Related**: `docs/todos/197-editor-config-blocks.md`

## References

- `packages/editor/packages/editor-state/src/features/project-config/effect.ts`
- `packages/editor/packages/editor-state/src/features/editor-config/effect.ts`

## Notes

- Compare **after** default merge to avoid false negatives from missing keys.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
