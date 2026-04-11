import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

function valueToY(value: number, minValue: number, inverseValueRange: number, height: number): number {
	if (inverseValueRange === 0) {
		return Math.floor(height / 2);
	}

	const normalized = (value - minValue) * inverseValueRange;
	return clamp(height - 1 - Math.round(normalized * (height - 1)), 0, height - 1);
}

function drawWaveform(
	engine: Engine,
	samples: ArrayLike<number>,
	baseIndex: number,
	arrayLength: number,
	width: number,
	height: number,
	columnWidth: number,
	columnCount: number,
	minValue: number,
	maxValue: number,
	inverseValueRange: number
): void {
	for (let column = 0; column < columnCount; column++) {
		const sliceStart = Math.floor((column / columnCount) * arrayLength);
		const sliceEnd = Math.max(sliceStart + 1, Math.floor(((column + 1) / columnCount) * arrayLength));
		let sliceMin = Number.POSITIVE_INFINITY;
		let sliceMax = Number.NEGATIVE_INFINITY;

		for (let index = sliceStart; index < sliceEnd; index++) {
			const sampleValue = samples[baseIndex + index];
			sliceMin = Math.min(sliceMin, sampleValue);
			sliceMax = Math.max(sliceMax, sampleValue);
		}

		const clampedMin = clamp(sliceMin, minValue, maxValue);
		const clampedMax = clamp(sliceMax, minValue, maxValue);
		const minY = valueToY(clampedMin, minValue, inverseValueRange, height);
		const maxY = valueToY(clampedMax, minValue, inverseValueRange, height);
		const rectY = Math.min(minY, maxY);
		const rectHeight = Math.max(1, Math.abs(maxY - minY) + 1);

		engine.drawSprite(column * columnWidth, rectY, 'waveform', columnWidth, rectHeight);
	}
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

	for (const {
		x,
		y,
		width,
		height,
		startAddress,
		inverseElementByteSize,
		baseSampleShift,
		length,
		pointer,
		sampleType,
		minValue,
		maxValue,
		inverseValueRange,
	} of codeBlock.widgets.arrayWaves) {
		engine.startGroup(x, y);

		const arrayLength =
			typeof length === 'number' ? length : memoryViews.int32[length.memory.wordAlignedAddress + length.bufferPointer];
		if (arrayLength <= 0 || inverseElementByteSize <= 0) {
			engine.endGroup();
			continue;
		}

		const startPointerValue = startAddress.showAddress
			? startAddress.memory.byteAddress
			: memoryViews.int32[startAddress.memory.wordAlignedAddress + startAddress.bufferPointer];
		const baseSampleIndex = startPointerValue >> baseSampleShift;
		const waveformColumnWidth = Math.max(1, Math.floor(state.viewport.vGrid / 2));
		const columnCount = Math.max(1, Math.floor(width / waveformColumnWidth));
		const columnWidth = Math.max(1, Math.floor(width / columnCount));
		drawWaveform(
			engine,
			memoryViews[sampleType],
			baseSampleIndex,
			arrayLength,
			width,
			height,
			columnWidth,
			columnCount,
			minValue,
			maxValue,
			inverseValueRange
		);

		if (pointer) {
			const pointerValue = pointer.showAddress
				? pointer.memory.byteAddress
				: memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer];
			const pointerIndex = Math.floor((pointerValue - startPointerValue) * inverseElementByteSize);
			const clampedIndex = Math.max(0, Math.min(pointerIndex, arrayLength - 1));
			const scanlineWidth = state.viewport.vGrid / 2;
			const scanlineX = arrayLength <= 1 ? 0 : Math.floor((clampedIndex / (arrayLength - 1)) * (width - scanlineWidth));

			engine.drawSprite(scanlineX, 0, 'scanLine', scanlineWidth, height);
		}

		engine.endGroup();
	}
}
