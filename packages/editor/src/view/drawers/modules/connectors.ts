import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, width, height, id: connectorId }] of module.outputs) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(connectorId);

		if (!memory) {
			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite(x, y, 0, width, height);
			continue;
		}

		const value = state.compiler.memoryBuffer[memory.wordAddress];

		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(x, y, value, width, height);
	}

	module.inputs.forEach(({ x, y, width, height }) => {
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	});
}
