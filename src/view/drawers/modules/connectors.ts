import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor, font } from '@8f4e/sprite-generator';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawConnectors(engine: Engine, state: State, id: string): void {
	if (!state.compiler.compiledModules.has(id)) {
		return;
	}

	for (let i = 0; i < state.compiler.compiledModules.get(id).outputs.length; i++) {
		const { byteAddress, id: connectorId } = state.compiler.compiledModules.get(id).outputs[i];
		const value = state.compiler.memoryBuffer[byteAddress / 4];
		const { x, y } = state.graphicHelper.get(id).outputs.get(connectorId);

		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(x, y, value, VGRID * 2, HGRID);
		engine.setSpriteLookup(font('white'));
		engine.drawText(x + 3 * VGRID, y, value.toString());
	}

	for (let i = 0; i < state.compiler.compiledModules.get(id).inputs.length; i++) {
		const { id: connectorId } = state.compiler.compiledModules.get(id).inputs[i];
		const { x, y } = state.graphicHelper.get(id).inputs.get(connectorId);

		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, 2 * VGRID, HGRID, 'rgb(153,153,153)');
	}
}
