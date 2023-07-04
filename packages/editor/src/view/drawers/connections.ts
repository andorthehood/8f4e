import { Engine } from '@8f4e/2d-engine';
import { fillColor } from '@8f4e/sprite-generator';

import { HGRID, VGRID } from './consts';

import { State } from '../../state/types';

export default function drawConnections(engine: Engine, state: State): void {
	engine.setSpriteLookup(fillColor);

	engine.startGroup(state.project.viewport.x, state.project.viewport.y);

	for (const module of state.graphicHelper.modules) {
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
				module.x + x + VGRID,
				module.y + y + HGRID / 2,
				output.module.x + output.x + VGRID,
				output.module.y + output.y + VGRID,
				'wire',
				1
			);
		}
	}

	engine.endGroup();
}
