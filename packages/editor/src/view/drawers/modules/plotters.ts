import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

const maxPlotterWidth = 256;

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.plotter);

	for (const [, { x, y, id, maxValue }] of module.bufferPlotters) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(id);

		if (!memory) {
			continue;
		}

		const { wordAddress } = memory;

		engine.startGroup(x, y);

		const width = Math.min(memory.wordSize, maxPlotterWidth);

		for (let i = 0; i < width; i++) {
			const value = memory.isInteger
				? state.compiler.memoryBuffer[wordAddress + i]
				: state.compiler.memoryBufferFloat[wordAddress + i];
			const normalizedValue = Math.floor((value / maxValue) * (state.graphicHelper.viewport.hGrid * 8));

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
