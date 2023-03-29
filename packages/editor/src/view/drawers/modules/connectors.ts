import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor } from '@8f4e/sprite-generator';

import { Module, ModuleGraphicData, State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, output] of module.outputs) {
		const { x, y, width, height, id: connectorId } = output;
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(connectorId);

		if (!memory) {
			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite(x, y, 0, width, height);
			continue;
		}

		const value = memory.isInteger
			? state.compiler.memoryBuffer[memory.wordAddress]
			: state.compiler.memoryBufferFloat[memory.wordAddress];

		output.calibratedMax = Math.max(1, output.calibratedMax, value);
		output.calibratedMin = Math.min(-1, output.calibratedMin, value);

		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(
			x,
			y,
			(value - output.calibratedMin) / (output.calibratedMax + Math.abs(output.calibratedMin)),
			width,
			height
		);
	}

	for (const [, { x, y, width, height, id }] of module.inputs) {
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');
	}
}
