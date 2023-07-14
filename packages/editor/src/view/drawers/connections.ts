import { Engine } from '@8f4e/2d-engine';
import { fillColor } from '@8f4e/sprite-generator';

import { State } from '../../state/types';

export default function drawConnections(engine: Engine, state: State): void {
	engine.setSpriteLookup(fillColor);

	engine.startGroup(state.project.viewport.x, state.project.viewport.y);

	for (const module of state.graphicHelper.modules) {
		const isSelected = module === state.graphicHelper.selectedModule;
		for (const [, { x, y, id }] of module.inputs) {
			const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(id);

			if (!memory || state.compiler.memoryBuffer[memory.wordAddress] === 0) {
				continue;
			}

			const output = state.graphicHelper.outputsByWordAddress.get(state.compiler.memoryBuffer[memory.wordAddress]);

			if (!output) {
				continue;
			}

			engine.drawLine(
				module.x + x + state.graphicHelper.viewport.vGrid,
				module.y + y + state.graphicHelper.viewport.hGrid / 2,
				output.module.x + output.x + state.graphicHelper.viewport.vGrid,
				output.module.y + output.y + state.graphicHelper.viewport.vGrid,
				isSelected ? 'wireHighlighted' : 'wire',
				1
			);
		}
	}

	engine.endGroup();
}
