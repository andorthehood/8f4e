import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawConnections(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

	engine.startGroup(-state.graphicHelper.activeViewport.viewport.x, -state.graphicHelper.activeViewport.viewport.y);

	for (const codeBlock of state.graphicHelper.activeViewport.codeBlocks) {
		const isSelected = codeBlock === state.graphicHelper.selectedCodeBlock;
		for (const [, { x, y, id }] of codeBlock.extras.inputs) {
			const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[id];

			if (!memory || state.compiler.memoryBuffer[memory.wordAlignedAddress] === 0) {
				continue;
			}

			const output = state.graphicHelper.outputsByWordAddress.get(
				state.compiler.memoryBuffer[memory.wordAlignedAddress]
			);

			if (!output) {
				continue;
			}

			engine.drawLine(
				codeBlock.x + codeBlock.offsetX + x + state.graphicHelper.globalViewport.vGrid,
				codeBlock.y + codeBlock.offsetY + y + state.graphicHelper.globalViewport.hGrid / 2,
				output.codeBlock.x + output.codeBlock.offsetX + output.x + state.graphicHelper.globalViewport.vGrid,
				output.codeBlock.y + output.codeBlock.offsetY + output.y + state.graphicHelper.globalViewport.vGrid,
				isSelected ? 'wireHighlighted' : 'wire',
				1
			);
		}
	}

	engine.endGroup();
}
