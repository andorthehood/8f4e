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

	for (const { x, y, width, height, id, min, max } of codeBlock.extras.sliders) {
		const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[id];

		if (!memory) {
			continue;
		}

		// Read the current value from memory
		const value = memory.isInteger
			? memoryViews.int32[memory.wordAlignedAddress]
			: memoryViews.float32[memory.wordAlignedAddress];

		// Handle edge case where min equals max
		if (min === max) {
			continue;
		}

		// Calculate normalized position (0..1)
		const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));

		// Calculate thumb width (1 grid column)
		const thumbWidth = state.viewport.vGrid;

		// Calculate thumb position within the slider width
		const thumbX = Math.floor(normalizedValue * (width - thumbWidth));

		engine.startGroup(x, y);

		// Draw the slider track (subtle background)
		// Using a very subtle color or the same background to keep it minimal

		// Draw the thumb/handle using the scanLine color (similar to scanner visual style)
		engine.drawSprite(thumbX, 0, 'scanLine', thumbWidth, height);

		engine.endGroup();
	}
}
