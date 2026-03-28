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

	const maxPlotterWidth = codeBlock.width - state.viewport.hGrid * 2;

	for (const { x, y, array, arrayLength, maxValue, minValue } of codeBlock.widgets.arrayPlotters) {
		engine.startGroup(x, y);

		let width = 0;

		if (arrayLength) {
			width = memoryViews.int32[arrayLength.memory.wordAlignedAddress];
		}

		width = Math.min(width || array.memory.wordAlignedSize, maxPlotterWidth);

		const height = maxValue - minValue;
		const offset = minValue * -1;

		for (let i = 0; i < width; i++) {
			let value: number;
			if (array.memory.elementWordSize === 1 && array.memory.isInteger) {
				const view = array.memory.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
				value = view[array.memory.byteAddress + i];
			} else if (array.memory.elementWordSize === 2 && array.memory.isInteger) {
				const view = array.memory.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
				value = view[array.memory.byteAddress / 2 + i];
			} else if (array.memory.elementWordSize === 8 && !array.memory.isInteger) {
				value = memoryViews.float64[array.memory.byteAddress / 8 + i];
			} else {
				value = array.memory.isInteger
					? memoryViews.int32[array.memory.wordAlignedAddress + i]
					: memoryViews.float32[array.memory.wordAlignedAddress + i];
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
