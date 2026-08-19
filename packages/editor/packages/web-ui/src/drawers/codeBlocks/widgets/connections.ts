import type { State } from '@8f4e/editor-state-types';
import type { SpriteLineColors } from '@8f4e/sprite-generator';
import type { LineDrawer } from 'glugglug2';
import type { MemoryViews } from '../../../types';

const WIRE_SPRITE = 'wire';
const WIRE_HIGHLIGHTED_SPRITE = 'wireHighlighted';

export default function drawConnections(
	lines: LineDrawer,
	lineColors: SpriteLineColors,
	state: State,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const codeBlock of state.codeBlockRendering.codeBlocks) {
		const isSelected = codeBlock === state.codeBlockRendering.selectedCodeBlock;

		if (!codeBlock.name) {
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

			lines.drawLine(
				codeBlock.x + codeBlock.offsetX + input.wireX - state.viewport.x,
				codeBlock.y + codeBlock.offsetY + input.wireY - state.viewport.y,
				output.codeBlock.x + output.codeBlock.offsetX + output.wireX - state.viewport.x,
				output.codeBlock.y + output.codeBlock.offsetY + output.wireY - state.viewport.y,
				1,
				lineColors[isSelected ? WIRE_HIGHLIGHTED_SPRITE : WIRE_SPRITE]
			);
		}
	}
}
