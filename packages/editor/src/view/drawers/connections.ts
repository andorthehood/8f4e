import { Engine } from '@8f4e/2d-engine';

import { State } from '../../state/types';

export default function drawConnections(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

	engine.startGroup(-state.graphicHelper.viewport.x, -state.graphicHelper.viewport.y);

	for (const codeBlock of state.graphicHelper.activeViewport) {
		const isSelected = codeBlock === state.graphicHelper.selectedCodeBlock;
		for (const [, { x, y, id }] of codeBlock.inputs) {
			const memory = state.compiler.compiledModules.get(codeBlock.id)?.memoryMap.get(id);

			if (!memory || state.compiler.memoryBuffer[memory.wordAddress] === 0) {
				continue;
			}

			const output = state.graphicHelper.outputsByWordAddress.get(state.compiler.memoryBuffer[memory.wordAddress]);

			if (!output) {
				continue;
			}

			engine.drawLine(
				codeBlock.x + codeBlock.offsetX + x + state.graphicHelper.viewport.vGrid,
				codeBlock.y + codeBlock.offsetY + y + state.graphicHelper.viewport.hGrid / 2,
				output.codeBlock.x + output.codeBlock.offsetX + output.x + state.graphicHelper.viewport.vGrid,
				output.codeBlock.y + output.codeBlock.offsetY + output.y + state.graphicHelper.viewport.vGrid,
				isSelected ? 'wireHighlighted' : 'wire',
				1
			);
		}
	}

	engine.endGroup();
}
