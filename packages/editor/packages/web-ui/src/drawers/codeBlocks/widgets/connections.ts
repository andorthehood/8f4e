import type { State } from '@8f4e/editor-state-types';
import type { Engine } from 'glugglug';
import type { MemoryViews } from '../../../types';

const WIRE_SPRITE = 'wire';
const WIRE_HIGHLIGHTED_SPRITE = 'wireHighlighted';

export default function drawConnections(engine: Engine, state: State, memoryViews: MemoryViews): void {
	if (!state.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.spriteLookups.fillColors);

	engine.startGroup(-state.viewport.x, -state.viewport.y);

	for (const codeBlock of state.codeBlockRendering.codeBlocks) {
		const isSelected = codeBlock === state.codeBlockRendering.selectedCodeBlock;

		if (!codeBlock.moduleId) {
			continue;
		}

		for (const input of codeBlock.widgets.inputs) {
			const outputAddress = memoryViews.int32[input.wordAlignedAddress];

			if (outputAddress === 0) {
				continue;
			}

			const output = state.codeBlockRendering.outputsByWordAddress.get(outputAddress);

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
