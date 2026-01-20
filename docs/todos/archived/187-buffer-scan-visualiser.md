---
title: 'TODO: Buffer Scan Visualiser'
priority: Medium
effort: 1-2h
created: 2026-01-20
status: Completed
completed: 2026-01-20
---

# Buffer Scan Visualiser

## Summary
Add a new visualiser for code blocks that renders a scanline traveling left-to-right across the code block width based on a buffer pointer. This is similar to the existing buffer plotter, but it shows the progress of a pointer scanning through a buffer.

## Instruction Format
Use a new instruction in code:

```
scan <buffer> <pointer>
```

- `<buffer>` is a memory identifier for the buffer being scanned.
- `<pointer>` is a memory identifier whose value is the current buffer index (word-aligned).
- No buffer length argument; always scan the full buffer length.

## Rendering Behavior
- Visual: a thin vertical rectangle (scanline) moving from left to right within the code block width.
- Position: drawn in the gap area below the `scan` instruction line.
- Gap size: 2 lines (height = `2 * hGrid`).
- Width: the scanline is 1 pixel (or 1 grid column) wide; choose a consistent sprite width that looks clean.
- Color: reuse existing plotter colors (`plotterTrace` for scanline; `plotterBackground` if a background is needed).
- Pointer clamping: if the pointer is out of range, clamp it to the valid range `[0, bufferLength - 1]`.

## Data Flow
Add a new extras array (e.g. `bufferScanners`) on code blocks:

```
bufferScanners: Array<{
  width: number;
  height: number;
  x: number;
  y: number;
  buffer: MemoryIdentifier;
  pointer: MemoryIdentifier;
}>
```

- `buffer` and `pointer` are resolved via `resolveMemoryIdentifier`.
- `width` should match the code block width (in pixels).
- `height` is `2 * hGrid`.
- `x` should align with the code text area (same left edge as plotter visuals).
- `y` should be based on the scan instruction line with `gapCalculator` + 1 offset (similar to plotters).

## Editor-State Changes (packages/editor/packages/editor-state)
- Add new feature folder: `features/code-blocks/features/bufferScanners/`
  - `codeParser.ts`: parse `scan` instructions into `{ bufferMemoryId, pointerMemoryId, lineNumber }`.
  - `updateGraphicData.ts`: resolve memory identifiers, calculate layout, and populate `graphicData.extras.bufferScanners`.
- Update types:
  - Add `BufferScanner` interface in `features/code-blocks/types.ts`.
  - Add `bufferScanners` to `CodeBlockGraphicData.extras`.
- Initialize `bufferScanners` in:
  - `features/code-blocks/features/graphicHelper/effect.ts`
  - `features/code-blocks/features/codeBlockCreator/effect.ts`
  - `pureHelpers/testingUtils/testUtils.ts`
- Update gaps:
  - In `features/code-blocks/features/graphicHelper/gaps.ts`, add `scan` instruction gap size of `2`.
- Wire in `bufferScanners` update in `graphicHelper/effect.ts` alongside existing extras (like bufferPlotters).

## Web UI Changes (packages/editor/packages/web-ui)
- Add new drawer: `src/drawers/codeBlocks/codeBlockDecorators/scanners.ts`.
  - Read `pointer` value from `memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer]`.
  - Determine buffer length from `buffer.memory.wordAlignedSize`.
  - Clamp pointer to `[0, bufferLength - 1]`.
  - Compute `x` offset within `width`: `Math.floor((clampedIndex / Math.max(bufferLength - 1, 1)) * (width - scanlineWidth))`.
  - Draw scanline using `spriteLookups.plotter` and `plotterTrace`.
- Add `drawScanners` in `src/drawers/codeBlocks/index.ts` with the other decorators.

## Tests
Add tests mirroring existing buffer plotter tests:
- `features/code-blocks/features/bufferScanners/codeParser.test.ts`
- `features/code-blocks/features/bufferScanners/updateGraphicData.test.ts`
- Update snapshot-based tests for extras initialization if needed.

## Notes
- Prefer reusing plotter sprite lookup and colors to avoid new sprite generation or color scheme changes.
- Use the same X alignment as plotters (line number column + padding).
- Keep calculations in pixels (using `vGrid`/`hGrid`).
