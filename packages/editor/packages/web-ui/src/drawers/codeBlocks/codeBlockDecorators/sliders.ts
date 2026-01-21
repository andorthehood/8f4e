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
		const thumbX = Math.floor(normalizedValue * (width - state.viewport.vGrid));

		engine.startGroup(x, y);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(0, 0, 'sliderThumb', thumbX, height);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(thumbX, 0, '#');
		engine.drawText(thumbX, state.viewport.hGrid, '#');

		engine.endGroup();
	}
}
