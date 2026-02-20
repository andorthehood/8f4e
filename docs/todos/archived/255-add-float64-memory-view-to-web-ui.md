---
title: 'TODO: Add float64 memory view to web-ui'
priority: Medium
effort: 4-8h
created: 2026-02-19
status: Completed
completed: 2026-02-19
---

# TODO: Add float64 memory view to web-ui

## Problem Description

The editor/web-ui memory view surface currently exposes 32-bit-centric views (`int32`, `float32`, etc.).

As float64 support expands in compiler/runtime paths, web-ui and host-side integrations need a first-class `Float64Array` view to access 64-bit memory consistently.

Without it, float64 reads/writes in UI-adjacent code will become fragmented and error-prone (ad-hoc `DataView` calls, duplicated conversion logic, inconsistent indexing).

## Proposed Solution

Add `float64` as a standard memory view in the existing memory view abstractions.

Scope:
- add `float64: Float64Array` to memory view types/interfaces,
- create/update this view in memory view manager lifecycle,
- propagate through web-ui/editor integration points, decorator drawers, and test mocks,
- keep existing view names/behavior unchanged.

Out of scope:
- changing global memory allocation grid,
- automatic migration of all existing float32 consumers to float64.

## Anti-Patterns

- Do not replace `float32` view usage globally.
- Do not add one-off `DataView` reads where shared memory views should be used.
- Do not introduce inconsistent naming (must be `float64` alongside `float32`).

## Implementation Plan

### Step 1: Extend shared memory view types
- Update memory view interfaces/types to include `float64: Float64Array`.
- Ensure all compile-time consumers typecheck with the expanded contract.

### Step 2: Wire memory view manager
- Update memory view manager to initialize and refresh `Float64Array` on buffer changes.
- Keep existing buffer identity update semantics unchanged.

### Step 3: Update consumers, mocks, and tests
- Update web-ui/editor mocks and screenshot test helpers to include `float64`.
- Update code-block decorator consumers that currently branch only on `isInteger` and default to `float32`, including:
  - `debuggers.ts`
  - `plotters.ts`
  - `connectors.ts`
  - `sliders.ts`
  - `pianoKeyboards.ts` (where applicable)
- Add targeted tests asserting `float64` view is created and refreshed with new buffers.
- Add targeted rendering/value-read tests for float64-backed memory items in drawers.

## Validation Checkpoints

- `rg -n "float32|int32|MemoryViews|createMemoryViewManager" packages/editor packages/editor/packages/web-ui`
- `rg -n "memoryViews\\.float32|memory\\.isInteger|elementWordSize" packages/editor/packages/web-ui/src/drawers/codeBlocks`
- `npx nx run editor:test`
- `npx nx run @8f4e/web-ui:test`

## Success Criteria

- [x] Memory view types include `float64: Float64Array`.
- [x] Memory view manager always exposes synchronized `float64` views.
- [x] Web-ui drawers that render/read float memory handle float64-backed memory items correctly.
- [x] Existing tests pass and mocks are updated to include `float64`.
- [x] No regressions in existing int32/float32 behavior.

## Affected Components

- `packages/editor/src/memoryViewManager.ts`
- `packages/editor/src/index.ts`
- `packages/editor/packages/web-ui/src/types.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/debuggers.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/plotters.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connectors.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/sliders.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/pianoKeyboards.ts`
- `packages/editor/packages/web-ui/screenshot-tests/utils/createMockMemoryViews.ts`
- related tests in editor/web-ui packages

## Risks & Considerations

- **Risk 1**: Type-surface ripple effects across consumers/mocks.
  - Mitigation: update all shared types first, then compile/test in one pass.
- **Risk 2**: Subtle buffer-refresh desync.
  - Mitigation: add explicit tests for view recreation after buffer identity change.

## Related Items

- **Related**: `docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`
- **Related**: `docs/todos/250-add-f64-push-support.md`
- **Related**: `docs/todos/253-add-f64-support-for-basic-arithmetic.md`

## Notes

- Keep indexing semantics explicit: `Float64Array` indexes in 8-byte elements, while many existing addresses are word/byte-based.
- This TODO only provides the view; per-feature adoption can be incremental.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
