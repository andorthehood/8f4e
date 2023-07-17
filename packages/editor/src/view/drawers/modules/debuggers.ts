import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const [, { x, y, wordAddress, isInteger }] of module.debuggers) {
		const value = isInteger
			? state.compiler.memoryBuffer[wordAddress].toString()
			: state.compiler.memoryBufferFloat[wordAddress].toFixed(4);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(x, y, '[' + value + ']');
	}
}
