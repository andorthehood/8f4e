---
title: 'TODO: Add Example Module Dependencies on Insert'
priority: Medium
effort: 4-6h
created: 2026-01-17
status: Open
completed: null
---

# TODO: Add Example Module Dependencies on Insert

## Problem Description

Example modules currently load as single code blocks. Some modules depend on companion modules and need to be inserted together. There is no `dependencies` field in `ExampleModule`, and the `addCodeBlockBySlug` flow only inserts one block. This makes it easy to insert a module without its required dependencies and forces users to manually add related modules.

## Proposed Solution

Add an optional `dependencies: string[]` field to `ExampleModule`, listing module slugs to insert alongside the requested module. Extend `addCodeBlockBySlug` to resolve dependencies, check for existing modules by `moduleId`, and insert missing dependencies to the right of the requested module in left-to-right order. Add a shared helper to compute code block grid width from code content and `minGridWidth`, matching the sizing logic used by `graphicHelper`.

## Implementation Plan

### Step 1: Add grid width helper
- Create a shared utility (e.g., `getCodeBlockGridWidth`) that returns grid width from `code` and `minGridWidth`.
- Mirror the width logic from `graphicHelper` (`lineNumberColumnWidth`, `getLongestLineLength`, `+4` padding).
- Use this helper in `graphicHelper` to keep sizing logic consistent.

### Step 2: Extend example module definitions
- Add optional `dependencies: string[]` to `ExampleModule` in `@8f4e/editor-state`.
- Update example module files under `src/examples/modules/` that require dependencies to include the new field.

### Step 3: Insert dependencies alongside requested module
- Update `addCodeBlockBySlug` to:
  - Load the requested module and its dependencies.
  - Insert the requested module at the clicked position.
  - Insert missing dependencies to the right, using computed grid widths plus a fixed grid gap.
  - Skip insertion when a dependency `moduleId` is already present in `graphicHelper.codeBlocks`.
- Keep the requested module position stable; dependencies shift to the right only.

### Step 4: Add tests
- Add unit tests to confirm:
  - Dependencies are inserted in left-to-right order.
  - Existing dependency modules are not reinserted.
  - Grid positions reflect width + spacing rules.

## Success Criteria

- [ ] Inserting a module with dependencies adds those modules to the right in declared order.
- [ ] Dependencies are not inserted if a code block with the same `moduleId` already exists.
- [ ] Placement uses consistent grid width calculations with `graphicHelper`.
- [ ] New tests pass under `npx nx run editor-state:test`.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Add optional `dependencies` to `ExampleModule`.
- `src/examples/modules/*.ts` - Add `dependencies` to relevant modules.
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts` - Dependency-aware insertion.
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` - Use shared grid width helper.
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/` - New helper for grid width.

## Risks & Considerations

- **Sizing drift**: If grid width logic diverges from render sizing, blocks may overlap; keep helper shared.
- **Circular dependencies**: Avoid infinite loops; only insert each dependency once per request.
- **ModuleId mismatch**: Dependency slugs must map to module IDs used in code; duplicates may still occur after user renames.

## Related Items

- **Depends on**: None
- **Related**: TODO 150 (Add Test Module Type)

## References

- None

## Notes

- Placement should be deterministic: requested module remains at click location, dependencies placed to the right.
