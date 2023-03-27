import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor } from '@8f4e/sprite-generator';

import { Module, ModuleGraphicData, State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, width, height, id: connectorId }] of module.outputs) {
		// const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(connectorId);

		// if (!memory) {
		// 	engine.setSpriteLookup(feedbackScale);
		// 	engine.drawSprite(x, y, 0, width, height);
		// 	continue;
		// }

		// const value = state.compiler.memoryBuffer[memory.wordAddress];

		// engine.setSpriteLookup(feedbackScale);
		// engine.drawSprite(x, y, value, width, height);

		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	}

	for (const [, { x, y, width, height, id }] of module.inputs) {
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	}
}
