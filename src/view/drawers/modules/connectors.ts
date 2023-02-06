import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor, font } from '@8f4e/sprite-generator';

import { State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, id: string): void {
	state.graphicHelper.get(id)?.outputs.forEach(({ x, y, width, height, id: connectorId, labelOffset }) => {
		const { byteAddress = 0 } = state.compiler.compiledModules.get(id)?.memoryMap.get(connectorId) || {};
		const value = state.compiler.memoryBuffer[byteAddress / 4] || 0;

		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(x, y, value, width, height);
		engine.setSpriteLookup(font('white'));
		engine.drawText(x + labelOffset, y, value.toString());
	});

	state.graphicHelper.get(id)?.inputs.forEach(({ x, y, width, height }) => {
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	});
}
