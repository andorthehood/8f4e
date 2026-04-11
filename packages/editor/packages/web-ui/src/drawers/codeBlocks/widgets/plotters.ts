import { Engine } from 'glugglug';

import { getBaseValueIndex, getTypedValueView } from './typedValueView';

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

	for (const { x, y, startAddress, baseSampleShift, length, valueType, maxValue, minValue } of codeBlock.widgets
		.arrayPlotters) {
		engine.startGroup(x, y);

		const baseValueIndex = getBaseValueIndex(startAddress, memoryViews, baseSampleShift);
		const values = getTypedValueView(memoryViews, valueType);
		const arrayLength =
			typeof length === 'number' ? length : memoryViews.int32[length.memory.wordAlignedAddress + length.bufferPointer];
		const width = Math.min(arrayLength || startAddress.memory.wordAlignedSize, maxPlotterWidth);

		const height = maxValue - minValue;
		const offset = minValue * -1;

		for (let i = 0; i < width; i++) {
			const value = values[baseValueIndex + i];

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
