import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.plotter);

	const maxPlotterWidth = codeBlock.width;

	for (const { x, y, buffer, bufferLength, maxValue, minValue } of codeBlock.extras.bufferPlotters) {
		engine.startGroup(x, y);

		let width = 0;

		if (bufferLength) {
			width = memoryViews.int32[bufferLength.memory.wordAlignedAddress];
		}

		width = Math.min(width || buffer.memory.wordAlignedSize, maxPlotterWidth);

		const height = maxValue - minValue;
		const offset = minValue * -1;

		for (let i = 0; i < width; i++) {
			let value: number;
			if (buffer.memory.elementWordSize === 1 && buffer.memory.isInteger) {
				const view = buffer.memory.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
				value = view[buffer.memory.byteAddress + i];
			} else if (buffer.memory.elementWordSize === 2 && buffer.memory.isInteger) {
				const view = buffer.memory.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
				value = view[buffer.memory.byteAddress / 2 + i];
			} else if (buffer.memory.elementWordSize === 8 && !buffer.memory.isInteger) {
				value = memoryViews.float64[buffer.memory.byteAddress / 8 + i];
			} else {
				value = buffer.memory.isInteger
					? memoryViews.int32[buffer.memory.wordAlignedAddress + i]
					: memoryViews.float32[buffer.memory.wordAlignedAddress + i];
			}

			const normalizedValue = Math.round(((value + offset) / height) * (state.viewport.hGrid * 8));

			engine.drawSprite(
				i * Math.floor(maxPlotterWidth / width),
				0,
				normalizedValue,
				Math.floor(maxPlotterWidth / width),
				state.viewport.hGrid * 8
			);
		}

		engine.endGroup();
	}
}
