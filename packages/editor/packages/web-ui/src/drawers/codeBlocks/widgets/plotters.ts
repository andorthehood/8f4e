import { Engine } from 'glugglug';

import { getBaseValueIndex, getTypedValueView } from './typedValueView';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

	const maxPlotterWidth = codeBlock.width - state.viewport.hGrid * 2;
	const plotHeight = state.viewport.hGrid * 8;
	const pointHeight = 1;

	for (const { x, y, startAddress, baseSampleShift, length, valueType, maxValue, minValue } of codeBlock.widgets
		.arrayPlotters) {
		engine.startGroup(x, y);

		const baseValueIndex = getBaseValueIndex(startAddress, memoryViews, baseSampleShift);
		const values = getTypedValueView(memoryViews, valueType);
		const arrayLength =
			typeof length === 'number' ? length : memoryViews.int32[length.memory.wordAlignedAddress + length.bufferPointer];
		const width = Math.min(arrayLength || startAddress.memory.wordAlignedSize, maxPlotterWidth);
		const valueRange = maxValue - minValue;
		const columnWidth = Math.max(1, Math.floor(maxPlotterWidth / Math.max(width, 1)));

		engine.drawSprite(0, 0, 'plotterBackground', maxPlotterWidth, plotHeight);

		for (let i = 0; i < width; i++) {
			const value = values[baseValueIndex + i];
			const normalizedValue = valueRange === 0 ? 0.5 : (value - minValue) / valueRange;
			const pointY = clamp(
				plotHeight - pointHeight - Math.round(normalizedValue * (plotHeight - pointHeight)),
				0,
				plotHeight - pointHeight
			);

			engine.drawSprite(i * columnWidth, pointY, 'trace', columnWidth, pointHeight);
		}

		engine.endGroup();
	}
}
