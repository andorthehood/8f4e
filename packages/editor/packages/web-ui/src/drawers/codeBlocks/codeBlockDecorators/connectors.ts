import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawConnectors(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const output of codeBlock.extras.outputs) {
		const { x, y, memory } = output;

		const value = memory.isInteger
			? memoryViews.int32[memory.wordAlignedAddress]
			: memoryViews.float32[memory.wordAlignedAddress];

		output.calibratedMax = Math.max(1, output.calibratedMax, value);
		output.calibratedMin = Math.min(-1, output.calibratedMin, value);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.feedbackScale);
		engine.drawSprite(
			x,
			y,
			Math.round(((value - output.calibratedMin) / (output.calibratedMax + Math.abs(output.calibratedMin))) * 5),
			state.viewport.vGrid * 3,
			state.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
	}

	for (const { x, y } of codeBlock.extras.inputs) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
		engine.drawSprite(x, y, Icon.INPUT);
	}
}
