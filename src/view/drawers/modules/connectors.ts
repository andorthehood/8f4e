import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor, font } from '@8f4e/sprite-generator';

import { Module, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: Module): void {
	const graphicData = state.graphicHelper.modules.get(module);

	if (!graphicData) {
		return;
	}

	for (const [, { x, y, width, height, id: connectorId }] of graphicData.outputs) {
		const { byteAddress = 0 } = state.compiler.compiledModules.get(graphicData.id)?.memoryMap.get(connectorId) || {};
		const value = state.compiler.memoryBuffer[byteAddress / 4] || 0;

		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(x, y, value, width, height);
	}

	graphicData.inputs.forEach(({ x, y, width, height }) => {
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	});

	for (const [, { x, y, id: debuggerId }] of graphicData.debuggers) {
		const { byteAddress = 0 } = state.compiler.compiledModules.get(graphicData.id)?.memoryMap.get(debuggerId) || {};
		const value = state.compiler.memoryBuffer[byteAddress / 4] || 0;

		engine.setSpriteLookup(font('lime'));
		engine.drawText(x, y, '[' + value.toString() + ']');
	}
}
