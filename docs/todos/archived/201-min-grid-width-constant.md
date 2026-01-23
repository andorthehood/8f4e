---
title: 'TODO: Make minGridWidth a shared constant'
priority: Medium
effort: 2-4 hours
created: 2026-01-22
status: Completed
completed: 2026-01-22
---

# TODO: Make minGridWidth a shared constant

## Problem Description

`minGridWidth` is currently set per `CodeBlockGraphicData` instance (for example in `populateCodeBlocks` and in helper creators). Because it lives on each block, different creation paths can assign different values or omit it, leading to inconsistent minimum widths. This makes layout behavior inconsistent and harder to reason about.

## Proposed Solution

Introduce a single shared constant for the minimum grid width of code blocks and use it everywhere code blocks are created. Update `getCodeBlockGridWidth` to default to this constant, and standardize any existing ad‑hoc values.

## Implementation Plan

### Step 1: Define the constant
- Add something like `CODE_BLOCK_MIN_GRID_WIDTH` in a shared code‑blocks utils module.
- Export it for reuse.

### Step 2: Use the constant in width calculations
- Update `getCodeBlockGridWidth` to use the constant as its default parameter.
- Replace all hardcoded `minGridWidth` values used in code‑block creation with the constant.

### Step 3: Consider removing per‑block minGridWidth
- If per‑block min width is not needed, remove the field from `CodeBlockGraphicData` and related constructors.
- Adjust any tests that assume a per‑block value.

## Success Criteria

- [ ] All code‑block creation paths use a single shared min width value
- [ ] `getCodeBlockGridWidth` defaults to the shared constant
- [ ] No regressions in code‑block sizing behavior (verified manually or via tests)

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth.ts` - default width calculation
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` - code‑block creation
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/createCodeBlockGraphicData.ts` - helper defaults

## Risks & Considerations

- **Risk 1**: Removing per‑block `minGridWidth` could break any code paths that rely on custom widths.
- **Risk 2**: Tests that expect specific widths may need updates.
- **Dependencies**: None.
- **Breaking Changes**: Potential if external consumers rely on `minGridWidth` customization.

## Related Items

- **Blocks**: None.
- **Depends on**: None.
- **Related**: `docs/todos/197-editor-config-blocks.md` (width behavior surfaced during editor-config work).

## References

- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`

## Notes

- Current min value appears as `32` in multiple creation paths.
- Ensure any future code‑block creation utilities adopt the constant.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
