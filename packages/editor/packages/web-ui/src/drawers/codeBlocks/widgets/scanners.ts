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

	for (const { x, y, width, height, array, pointer } of codeBlock.widgets.arrayScanners) {
		engine.startGroup(x, y);

		// Get the array length
		const arrayLength = array.memory.numberOfElements;

		// Read the pointer value
		const pointerValue = memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer];

		// Clamp the pointer to valid range [0, arrayLength - 1]
		const clampedIndex = Math.max(0, Math.min(pointerValue, arrayLength - 1));

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
