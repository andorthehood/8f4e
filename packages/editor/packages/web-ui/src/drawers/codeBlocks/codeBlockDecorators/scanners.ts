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

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.plotter);

	for (const { x, y, width, height, buffer, pointer } of codeBlock.extras.bufferScanners) {
		engine.startGroup(x, y);

		// Get the buffer length
		const bufferLength = buffer.memory.wordAlignedSize;

		// Read the pointer value
		const pointerValue = memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer];

		// Clamp the pointer to valid range [0, bufferLength - 1]
		const clampedIndex = Math.max(0, Math.min(pointerValue, bufferLength - 1));

		// Calculate scanline width (1 grid column)
		const scanlineWidth = state.viewport.vGrid;

		// Calculate x position within the scanner width
		const scanlineX = Math.floor((clampedIndex / Math.max(bufferLength - 1, 1)) * (width - scanlineWidth));

		// Draw the scanline using plotter sprite (sprite 0 is at the bottom of the plotter sprite sheet)
		// We use sprite 0 and draw it with the full height to create a vertical line
		engine.drawSprite(scanlineX, 0, 0, scanlineWidth, height);

		engine.endGroup();
	}
}
