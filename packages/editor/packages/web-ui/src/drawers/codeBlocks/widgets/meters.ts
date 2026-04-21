import { Engine } from 'glugglug';

import { getTypedValueView } from './typedValueView';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

const GREEN_START_FACTOR = 0.75;
const RED_THRESHOLD = 0.9;

const overloadHoldByMeter = new WeakMap<CodeBlockGraphicData['widgets']['arrayMeters'][number], true>();

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

function normalizeMeterValue(value: number, minValue: number, maxValue: number): number {
	if (minValue === maxValue) {
		return 0;
	}

	if (minValue < 0 && maxValue > 0) {
		const amplitudeLimit = Math.max(Math.abs(minValue), Math.abs(maxValue));

		return amplitudeLimit === 0 ? 0 : clamp(Math.abs(value) / amplitudeLimit, 0, 1);
	}

	return clamp((value - minValue) / (maxValue - minValue), 0, 1);
}

function isMeterOverloaded(value: number, minValue: number, maxValue: number): boolean {
	if (minValue < 0 && maxValue > 0) {
		return Math.abs(value) > Math.max(Math.abs(minValue), Math.abs(maxValue));
	}

	return value < minValue || value > maxValue;
}

function getMeterValueIndex(
	memory: CodeBlockGraphicData['widgets']['arrayMeters'][number]['memory'],
	baseSampleShift: 0 | 1 | 2 | 3,
	memoryViews: MemoryViews
): number {
	if (memory.showAddress) {
		return (memory.memory.byteAddress >> baseSampleShift) + memory.bufferPointer;
	}

	if (memory.memory.pointeeBaseType || memory.memory.isPointingToPointer) {
		return memoryViews.int32[memory.memory.wordAlignedAddress + memory.bufferPointer] >> baseSampleShift;
	}

	return (memory.memory.byteAddress >> baseSampleShift) + memory.bufferPointer;
}

function drawSegment(
	engine: Engine,
	startX: number,
	endX: number,
	fillWidth: number,
	sprite: 'meterGreen' | 'meterYellow' | 'meterRed',
	height: number
): void {
	const segmentStart = Math.floor(startX);
	const segmentEnd = Math.floor(endX);
	const width = Math.min(segmentEnd - segmentStart, Math.max(0, fillWidth - segmentStart));

	if (width <= 0) {
		return;
	}

	engine.drawSprite(segmentStart, 0, sprite, width, height);
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

	for (const meter of codeBlock.widgets.arrayMeters) {
		const { x, y, width, height, memory, baseSampleShift, valueType, minValue, maxValue } = meter;
		engine.startGroup(x, y);

		const values = getTypedValueView(memoryViews, valueType);
		const value = values[getMeterValueIndex(memory, baseSampleShift, memoryViews)] ?? minValue;
		const normalized = normalizeMeterValue(value, minValue, maxValue);
		const yellowStart = RED_THRESHOLD * GREEN_START_FACTOR;
		const fillWidth = Math.round(normalized * width);
		const overloaded = isMeterOverloaded(value, minValue, maxValue);
		const overloadMarkerWidth = Math.min(state.viewport.vGrid, width);

		engine.drawSprite(0, 0, 'plotterBackground', width, height);
		drawSegment(engine, 0, width * yellowStart, fillWidth, 'meterGreen', height);
		drawSegment(engine, width * yellowStart, width * RED_THRESHOLD, fillWidth, 'meterYellow', height);
		drawSegment(engine, width * RED_THRESHOLD, width, fillWidth, 'meterRed', height);

		if (overloaded) {
			overloadHoldByMeter.set(meter, true);
		}

		if (overloadHoldByMeter.has(meter)) {
			engine.drawSprite(width - overloadMarkerWidth, 0, 'meterRed', overloadMarkerWidth, height);
		}

		engine.endGroup();
	}
}
