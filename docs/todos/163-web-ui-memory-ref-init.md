---
title: 'TODO: Web-UI Memory Ref Init And Views'
priority: Medium
effort: 2-3 days
created: 2026-01-07
status: Open
completed: null
---

# TODO: Web-UI Memory Ref Init And Views

## Problem Description

The web-ui package currently reads `memoryBuffer` and `memoryBufferFloat` from editor-state. That creates a direct dependency on compiler state inside the render layer, makes the view responsible for knowing where memory lives, and complicates future refactors that decouple state from runtime memory.

## Proposed Solution

Move memory access into web-ui init via a stable ref holder. The init function will accept a `MemoryRef` object that always points at the current memory buffer. Web-ui will create the `Int32Array` and `Float32Array` views from the buffer and pass those views down into the draw functions that need memory data. A small identity check will recreate the views if the underlying buffer object changes (e.g., due to memory growth).

## Implementation Plan

### Step 1: Define the memory ref contract in web-ui
- Add a `MemoryRef` type in `packages/editor/packages/web-ui/src/index.ts` (or `packages/editor/packages/web-ui/src/types.ts`) with the shape `{ current: WebAssembly.Memory | ArrayBuffer | null }`.
- Add a helper that resolves the current `ArrayBuffer` and recreates `Int32Array`/`Float32Array` only when the buffer identity changes.
- Assume `memoryRef.current` is always set before rendering begins.

### Step 2: Thread memory views through the render pipeline
- Update the init signature in `packages/editor/packages/web-ui/src/index.ts` to accept `memoryRef` and obtain `memoryViews` in the render loop.
- Update `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` to accept `memoryViews` and use them for offsetter reads.
- Update all memory-reading decorators to accept `memoryViews` and avoid reading from `state.compiler.*`:
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/buttons.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connections.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/connectors.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/debuggers.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/pianoKeyboards.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/plotters.ts`
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/switches.ts`

### Step 3: Update the editor integration
- Create a stable `memoryRef` object in `packages/editor/src/index.ts` and pass it to web-ui init.
- Update the compiler pipeline (or store subscriptions) to keep `memoryRef.current` pointing at the latest `WebAssembly.Memory` or `ArrayBuffer`.

### Step 4: Update tests and documentation
- Update web-ui screenshot tests to pass a `memoryRef` to init:
  - `packages/editor/packages/web-ui/screenshot-tests/context-menu.test.ts`
  - `packages/editor/packages/web-ui/screenshot-tests/dragged-modules.test.ts`
  - `packages/editor/packages/web-ui/screenshot-tests/font-color-rendering.test.ts`
  - `packages/editor/packages/web-ui/screenshot-tests/switches.test.ts`
- If helpful, add a small test helper to produce a default `MemoryRef` for screenshot tests.
- Update `packages/editor/packages/web-ui/README.md` usage snippet for the new init signature and memory ref.

## Success Criteria

- [ ] Web-ui no longer reads `state.compiler.memoryBuffer` or `state.compiler.memoryBufferFloat`.
- [ ] Web-ui init accepts a `MemoryRef` and creates the two typed views internally.
- [ ] All memory-dependent drawers receive `memoryViews` explicitly and render correctly.
- [ ] Screenshot tests and README are updated for the new init signature.

## Affected Components

- `packages/editor/packages/web-ui/src/index.ts` - init signature and memory view creation
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` - memory views threading
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/*` - memory reads moved off state
- `packages/editor/src/index.ts` - web-ui init call site
- `packages/editor/packages/web-ui/screenshot-tests/*.test.ts` - init signature updates
- `packages/editor/packages/web-ui/README.md` - usage example updates

## Risks & Considerations

- **Memory growth**: `WebAssembly.Memory` can swap its underlying buffer; ensure views are recreated when the buffer identity changes.
- **Breaking change**: `@8f4e/web-ui` init signature changes; all consumers must be updated in lockstep.

## Related Items

- **Related**: `docs/todos/archived/090-remove-webassembly-memory-dependency-from-editor-state.md`

## References

- `packages/editor/packages/web-ui/src/index.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/`
- `packages/editor/src/index.ts`

## Notes

- Use a stable ref holder to avoid a new API for memory updates.
- Keep the memory view recreation check lightweight (pointer equality on the underlying buffer).

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
