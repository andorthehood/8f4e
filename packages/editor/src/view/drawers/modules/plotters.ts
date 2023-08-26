import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.plotter);

	const maxPlotterWidth = module.width;

	for (const [, { x, y, buffer, bufferLength, maxValue, minValue }] of module.bufferPlotters) {
		engine.startGroup(x, y);

		let width = 0;

		if (bufferLength) {
			width = state.compiler.memoryBuffer[bufferLength.memory.wordAddress];
		}

		width = Math.min(width || buffer.memory.wordSize, maxPlotterWidth);

		const height = maxValue - minValue;
		const offset = minValue * -1;

		for (let i = 0; i < width; i++) {
			const value = buffer.memory.isInteger
				? state.compiler.memoryBuffer[buffer.memory.wordAddress + i]
				: state.compiler.memoryBufferFloat[buffer.memory.wordAddress + i];

			const normalizedValue = Math.round(((value + offset) / height) * (state.graphicHelper.viewport.hGrid * 8));

			engine.drawSprite(
				i * Math.floor(maxPlotterWidth / width),
				0,
				normalizedValue,
				Math.floor(maxPlotterWidth / width),
				state.graphicHelper.viewport.hGrid * 8
			);
		}

		engine.endGroup();
	}
}
