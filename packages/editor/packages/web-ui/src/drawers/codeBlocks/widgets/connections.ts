import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

const WIRE_SPRITE = 'wire';
const WIRE_HIGHLIGHTED_SPRITE = 'wireHighlighted';

export default function drawConnections(engine: Engine, state: State, memoryViews: MemoryViews): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

	engine.startGroup(-state.viewport.x, -state.viewport.y);

	for (const codeBlock of state.graphicHelper.codeBlocks) {
		const isSelected = codeBlock === state.graphicHelper.selectedCodeBlock;

		if (!codeBlock.moduleId) {
			continue;
		}

		for (const input of codeBlock.widgets.inputs) {
			const outputAddress = memoryViews.int32[input.wordAlignedAddress];

			if (outputAddress === 0) {
				continue;
			}

			const output = state.graphicHelper.outputsByWordAddress.get(outputAddress);

			if (!output) {
				continue;
			}

			engine.drawLine(
				codeBlock.x + codeBlock.offsetX + input.wireX,
				codeBlock.y + codeBlock.offsetY + input.wireY,
				output.codeBlock.x + output.codeBlock.offsetX + output.wireX,
				output.codeBlock.y + output.codeBlock.offsetY + output.wireY,
				isSelected ? WIRE_HIGHLIGHTED_SPRITE : WIRE_SPRITE,
				1
			);
		}
	}

	engine.endGroup();
}
