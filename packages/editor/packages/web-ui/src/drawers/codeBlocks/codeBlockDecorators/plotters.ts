import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';

export default function drawer(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.plotter);

	const maxPlotterWidth = codeBlock.width;

	for (const [, { x, y, buffer, bufferLength, maxValue, minValue }] of codeBlock.extras.bufferPlotters) {
		engine.startGroup(x, y);

		let width = 0;

		if (bufferLength) {
			width = state.compiler.memoryBuffer[bufferLength.memory.wordAlignedAddress];
		}

		width = Math.min(width || buffer.memory.wordAlignedSize, maxPlotterWidth);

		const height = maxValue - minValue;
		const offset = minValue * -1;

		for (let i = 0; i < width; i++) {
			const value = buffer.memory.isInteger
				? state.compiler.memoryBuffer[buffer.memory.wordAlignedAddress + i]
				: state.compiler.memoryBufferFloat[buffer.memory.wordAlignedAddress + i];

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
