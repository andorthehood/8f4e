---
title: Add code block slider control directive
priority: 🟡
effort: 1-2d
created: 2026-01-21
completed: 2026-01-22
status: Completed
---

# Add code block slider control directive

## Goal

Introduce a `# slider` directive that renders an interactive horizontal slider inside a code block, similar to the existing scanner visual style. The slider writes directly to a memory word (like switches) and supports click-to-set plus drag-to-scrub interactions.

## User Requirements (from request)

- Syntax: `# slider <memoryId> <min?> <max?> <step?>`
- Writes directly to a memory word (no buffer/pointer indirection).
- Horizontal bar with a thumb/handle styled like the scanner line.
- No numeric readout needed.
- Interaction: click to set + drag to scrub.
- Default range when min/max omitted:
  - Integers: 0..127
  - Floats: 0..1

## High-Level Plan

1. **Data Model + Parsing (editor-state)**
   - Add a `Slider` type in `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`.
   - Extend `CodeBlockGraphicData.extras` with `sliders: Slider[]`.
   - Create feature folder: `features/code-blocks/features/sliders/` with `codeParser.ts`, `updateGraphicData.ts`, `interaction.ts`, and `findSliderAtViewportCoordinates.ts`.
   - Parsing should read `# slider memoryId [min] [max] [step]`.
   - Add default range behavior based on memory type (int vs float).

2. **Graphic Data Derivation**
   - `updateGraphicData.ts` should resolve memory id with `resolveMemoryIdentifier`.
   - Compute slider geometry:
     - Width: similar to scanners (full content width after line numbers).
     - Height: 1–2 rows (match scanner height for consistency).
     - X/Y: line-based placement using `gapCalculator`.
   - Store computed min/max/step and a reference to the resolved memory identifier.

3. **Rendering (web-ui)**
   - Add a drawer in `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/sliders.ts`.
   - Render a horizontal track and a thumb.
   - Use existing fill colors (e.g., `scanLine`) unless a new slider color is added to `sprite-generator`.
   - Add slider drawer to `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts`.

4. **Interaction**
   - Use events similar to switches/buttons (`codeBlockClick`) and add drag handling.
   - New interaction should listen to mouse down + move + up and only engage when pointer is inside slider bounds.
   - Convert pointer position to value, apply min/max clamp, snap to step if provided.
   - Write value using `state.callbacks?.setWordInMemory`.

5. **Tests**
   - Add parser tests (like `bufferScanners`).
   - Add `updateGraphicData` tests and snapshot.
   - Add interaction tests for click and drag (mimic switches/buttons tests).
   - Update mock helpers/snapshots to include `sliders` in extras.

## Suggested File Touch Points

- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/testingUtils/testUtils.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/testingUtils/__snapshots__/testUtils.test.ts.snap`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/codeBlockDecorators/sliders.ts` (new)

## Notes

- Default range depends on memory type: integers -> 0..127; floats -> 0..1.
- Step optional: when provided, snap to increments from min (e.g., `min + n*step`).
- Use existing patterns from `switches`, `buttons`, and `scanners` for structure and event wiring.
