import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

function readSampleValue(
	memoryViews: MemoryViews,
	sampleType: CodeBlockGraphicData['widgets']['arrayScanners'][number]['sampleType'],
	byteAddress: number,
	index: number
): number {
	if (sampleType === 'int8') {
		return memoryViews.int8[byteAddress + index];
	}

	if (sampleType === 'uint8') {
		return memoryViews.uint8[byteAddress + index];
	}

	if (sampleType === 'int16') {
		return memoryViews.int16[byteAddress / 2 + index];
	}

	if (sampleType === 'uint16') {
		return memoryViews.uint16[byteAddress / 2 + index];
	}

	if (sampleType === 'float64') {
		return memoryViews.float64[byteAddress / 8 + index];
	}

	if (sampleType === 'float32') {
		return memoryViews.float32[byteAddress / 4 + index];
	}

	return memoryViews.int32[byteAddress / 4 + index];
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

function valueToY(value: number, minValue: number, maxValue: number, height: number): number {
	if (minValue === maxValue) {
		return Math.floor(height / 2);
	}

	const normalized = (clamp(value, minValue, maxValue) - minValue) / (maxValue - minValue);
	return clamp(height - 1 - Math.round(normalized * (height - 1)), 0, height - 1);
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
		elementByteSize,
		length,
		pointer,
		sampleType,
		minValue,
		maxValue,
	} of codeBlock.widgets.arrayScanners) {
		engine.startGroup(x, y);

		const arrayLength =
			typeof length === 'number' ? length : memoryViews.int32[length.memory.wordAlignedAddress + length.bufferPointer];
		if (arrayLength <= 0 || elementByteSize <= 0) {
			engine.endGroup();
			continue;
		}

		const startPointerValue = startAddress.showAddress
			? startAddress.memory.byteAddress
			: memoryViews.int32[startAddress.memory.wordAlignedAddress + startAddress.bufferPointer];
		const waveformColumnWidth = Math.max(1, Math.floor(state.viewport.vGrid / 2));
		const columnCount = Math.max(1, Math.floor(width / waveformColumnWidth));
		const columnWidth = Math.max(1, Math.floor(width / columnCount));

		for (let column = 0; column < columnCount; column++) {
			const sliceStart = Math.floor((column / columnCount) * arrayLength);
			const sliceEnd = Math.max(sliceStart + 1, Math.floor(((column + 1) / columnCount) * arrayLength));
			let sliceMin = Number.POSITIVE_INFINITY;
			let sliceMax = Number.NEGATIVE_INFINITY;

			for (let index = sliceStart; index < sliceEnd; index++) {
				const sampleValue = readSampleValue(memoryViews, sampleType, startPointerValue, index);
				sliceMin = Math.min(sliceMin, sampleValue);
				sliceMax = Math.max(sliceMax, sampleValue);
			}

			const minY = valueToY(sliceMin, minValue, maxValue, height);
			const maxY = valueToY(sliceMax, minValue, maxValue, height);
			const rectY = Math.min(minY, maxY);
			const rectHeight = Math.max(1, Math.abs(maxY - minY) + 1);

			engine.drawSprite(column * columnWidth, rectY, 'scanWave', columnWidth, rectHeight);
		}

		if (pointer) {
			const pointerValue = pointer.showAddress
				? pointer.memory.byteAddress
				: memoryViews.int32[pointer.memory.wordAlignedAddress + pointer.bufferPointer];
			const pointerIndex = Math.floor((pointerValue - startPointerValue) / elementByteSize);
			const clampedIndex = Math.max(0, Math.min(pointerIndex, arrayLength - 1));
			const scanlineWidth = state.viewport.vGrid / 2;
			const scanlineX = arrayLength <= 1 ? 0 : Math.floor((clampedIndex / (arrayLength - 1)) * (width - scanlineWidth));

			engine.drawSprite(scanlineX, 0, 'scanLine', scanlineWidth, height);
		}

		engine.endGroup();
	}
}
