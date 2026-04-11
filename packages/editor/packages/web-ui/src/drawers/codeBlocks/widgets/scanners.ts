import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

	for (const { x, y, width, height, startAddress, elementByteSize, length, pointer } of codeBlock.widgets
		.arrayScanners) {
		engine.startGroup(x, y);

		const arrayLength =
			typeof length === 'number' ? length : memoryViews.int32[length.memory.wordAlignedAddress + length.bufferPointer];
		if (arrayLength <= 0 || elementByteSize <= 0) {
			engine.endGroup();
			continue;
		}

		const startPointerValue = startAddress.showAddress
			? startAddress.memory.byteAddress
			: memoryViews.int32[startAddress.memory.wordAlignedAddress + startAddress.bufferPointer];
		const pointerValue = pointer.showAddress
			? pointer.memory.byteAddress
			: memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer];
		const pointerIndex = Math.floor((pointerValue - startPointerValue) / elementByteSize);

		// Clamp the absolute pointer-derived index to the visible element range.
		const clampedIndex = Math.max(0, Math.min(pointerIndex, arrayLength - 1));

		// Calculate scanline width (1 grid column)
		const scanlineWidth = state.viewport.vGrid;

		// Calculate x position within the scanner width
		// For single-element arrays, scanline is always at position 0
		const scanlineX = arrayLength <= 1 ? 0 : Math.floor((clampedIndex / (arrayLength - 1)) * (width - scanlineWidth));

		// Draw the scanline using the scanLine color
		engine.drawSprite(scanlineX, 0, 'scanLine', scanlineWidth, height);

		engine.endGroup();
	}
}
