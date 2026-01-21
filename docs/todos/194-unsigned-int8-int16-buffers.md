---
title: 'TODO: Add Unsigned int8/int16 Buffer Support (Compiler + Web-UI)'
priority: Medium
effort: 1-2d
created: 2026-01-21
status: Open
completed: null
---

# TODO: Add Unsigned int8/int16 Buffer Support (Compiler + Web-UI)

## Problem Description

8f4e currently supports signed integer buffers (`int8[]`, `int16[]`, `int32[]`) and has unsigned load instructions (`load8u`, `load16u`). There is no way to declare an unsigned buffer type in the language or surface it in the web-ui. This causes:
- Values stored in 8/16-bit buffers to be interpreted and displayed as signed in the debugger/plotters.
- `^`/`!` min/max prefixes to return signed ranges even when unsigned semantics are desired.
- No explicit metadata to distinguish signed vs unsigned 8/16-bit buffers for tooling/UI.

The desired change is to add `int8u[]` and `int16u[]` buffer declarations (unsigned) while **not** adding write support (no new store instructions yet).

## Proposed Solution

Add unsigned buffer variants (`int8u[]`, `int16u[]`) and track unsignedness in memory metadata so UI and helper utilities can interpret values correctly. Keep write behavior unchanged for now (still only `store`/`i32.store`).

Key ideas:
- Treat unsigned as a **buffer-only** distinction (no `int8u` scalar yet).
- Extend `DataStructure` with an `isUnsigned` flag or similar.
- Ensure min/max helpers use unsigned ranges for these buffers.
- Add `Uint8Array`/`Uint16Array` views to web-ui and memoryViewManager, and use them when `isUnsigned`.

## Implementation Plan

### Step 1: Compiler: instruction variants + metadata
- Add `int8u[]` and `int16u[]` to instruction map in `packages/compiler/src/instructionCompilers/index.ts`.
- Update buffer compiler in `packages/compiler/src/instructionCompilers/buffer.ts` to detect unsigned variants and set `isUnsigned` in memory metadata.
- Extend `DataStructure` in `packages/compiler/src/types.ts` to include `isUnsigned: boolean` (or equivalent) so downstream code can branch.
- Decide how `type` should be stored (e.g., `int8u`, `int16u`, or keep `int` plus flags); document in code.

### Step 2: Compiler helpers + tests
- Update `packages/compiler/src/utils/memoryData.ts` so `getElementMaxValue` / `getElementMinValue` return unsigned ranges for `isUnsigned`:
  - `int8u[]`: 0..255
  - `int16u[]`: 0..65535
- Add/adjust in-source tests in `memoryData.ts` and buffer compiler tests (unsigned cases).

### Step 3: Web-UI memory views + rendering
- Extend `packages/editor/packages/web-ui/src/types.ts` to include `uint8` and `uint16` views.
- Update `packages/editor/src/memoryViewManager.ts` to construct `Uint8Array` / `Uint16Array` alongside existing views.
- Update drawers that read memory values to respect `isUnsigned`:
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/debuggers.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/plotters.ts`
  - Any other places that switch on `memory.isInteger` and `elementWordSize`.

### Step 4: Editor-state + tests
- Update any editor-state tests that assert memory metadata shape to include `isUnsigned` where needed.
- Update fixtures or mock memory entries used by tests under `packages/editor/packages/editor-state/src/features/code-blocks/features/**`.

### Step 5: Documentation
- Update `packages/compiler/docs/instructions/declarations-and-locals.md` with new `int8u[]` / `int16u[]` variants.
- Update `packages/compiler/docs/prefixes.md` to document unsigned min/max values and clarify how unsigned buffers affect `^` / `!` prefixes.

## Success Criteria

- [ ] `int8u[]` and `int16u[]` compile successfully and appear in memory maps with unsigned metadata.
- [ ] `^name` / `!name` return 0..255 and 0..65535 for unsigned buffers.
- [ ] Debuggers/plotters display unsigned buffer contents using Uint8Array/Uint16Array views.
- [ ] Typecheck/tests pass; updated snapshots where needed.

## Affected Components

- `packages/compiler/src/instructionCompilers/index.ts` - add new instruction keywords
- `packages/compiler/src/instructionCompilers/buffer.ts` - detect unsigned variants, set metadata
- `packages/compiler/src/types.ts` - add unsigned metadata
- `packages/compiler/src/utils/memoryData.ts` - unsigned min/max ranges
- `packages/compiler/docs/instructions/declarations-and-locals.md` - document new buffer types
- `packages/compiler/docs/prefixes.md` - document unsigned ranges
- `packages/editor/packages/web-ui/src/types.ts` - add uint views
- `packages/editor/src/memoryViewManager.ts` - create uint views
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/debuggers.ts` - read uint views when unsigned
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/plotters.ts` - read uint views when unsigned
- `packages/editor/packages/editor-state/src/features/code-blocks/features/**` - update tests/mocks using memory metadata

## Risks & Considerations

- **API surface change**: `MemoryViews` gains new fields, requiring updates wherever it’s constructed or consumed.
- **Snapshot churn**: tests that snapshot memory metadata or rendered values will need updates.
- **Semantics clarity**: ensure unsigned is only a display/load-time interpretation (no new store behavior yet).
- **Compatibility**: avoid introducing `int8u`/`int16u` scalars unless explicitly desired.

## Related Items

- **Related**: `docs/todos/193-add-min-max-prefixes.md` (unsigned min/max should align with prefix behavior)

## References

- `packages/compiler/src/instructionCompilers/index.ts`
- `packages/compiler/src/instructionCompilers/buffer.ts`
- `packages/compiler/src/utils/memoryData.ts`
- `packages/editor/src/memoryViewManager.ts`
- `packages/editor/packages/web-ui/src/types.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/debuggers.ts`

## Notes

- Write support is intentionally out of scope. If added later, use `i32.store8` / `i32.store16` instructions with optional masking (e.g., `& 0xff` / `& 0xffff`) and new language instructions (`store8`/`store16`).
- Unsigned handling should only affect interpretation (load, min/max, UI), not memory layout.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
