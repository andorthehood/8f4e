import { Engine } from '@8f4e/2d-engine';
import { Icon } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const [, output] of module.outputs) {
		const { x, y, isInteger, wordAddress } = output;

		const value = isInteger ? state.compiler.memoryBuffer[wordAddress] : state.compiler.memoryBufferFloat[wordAddress];

		output.calibratedMax = Math.max(1, output.calibratedMax, value);
		output.calibratedMin = Math.min(-1, output.calibratedMin, value);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.feedbackScale);
		engine.drawSprite(
			x,
			y,
			Math.round(((value - output.calibratedMin) / (output.calibratedMax + Math.abs(output.calibratedMin))) * 5),
			state.graphicHelper.viewport.vGrid * 3,
			state.graphicHelper.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
	}

	for (const [, { x, y }] of module.inputs) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
		engine.drawSprite(x, y, Icon.INPUT);
	}
}
