import { Engine } from 'glugglug';

import { getTypedValueView } from './typedValueView';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

const overloadHoldByMeter = new WeakMap<CodeBlockGraphicData['widgets']['arrayMeters'][number], true>();

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

function getMeterValueIndex(
	meter: CodeBlockGraphicData['widgets']['arrayMeters'][number],
	baseSampleShift: 0 | 1 | 2 | 3,
	memoryViews: MemoryViews
): number {
	if (meter.staticValueIndex !== undefined) {
		return meter.staticValueIndex;
	}

	const { memory } = meter;

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
		const {
			x,
			y,
			width,
			height,
			baseSampleShift,
			valueType,
			minValue,
			maxValue,
			isBipolar,
			amplitudeLimit,
			inverseValueRange,
			greenEndX,
			yellowEndX,
			overloadMarkerX,
			overloadMarkerWidth,
		} = meter;
		engine.startGroup(x, y);

		const values = getTypedValueView(memoryViews, valueType);
		const value = values[getMeterValueIndex(meter, baseSampleShift, memoryViews)] ?? minValue;
		const normalized = isBipolar
			? amplitudeLimit === 0
				? 0
				: clamp(Math.abs(value) / amplitudeLimit, 0, 1)
			: clamp((value - minValue) * inverseValueRange, 0, 1);
		const fillWidth = Math.round(normalized * width);
		const overloaded = isBipolar ? Math.abs(value) > amplitudeLimit : value < minValue || value > maxValue;

		engine.drawSprite(0, 0, 'plotterBackground', width, height);
		drawSegment(engine, 0, greenEndX, fillWidth, 'meterGreen', height);
		drawSegment(engine, greenEndX, yellowEndX, fillWidth, 'meterYellow', height);
		drawSegment(engine, yellowEndX, width, fillWidth, 'meterRed', height);

		if (overloaded) {
			overloadHoldByMeter.set(meter, true);
		}

		if (overloadHoldByMeter.has(meter)) {
			engine.drawSprite(overloadMarkerX, 0, 'meterRed', overloadMarkerWidth, height);
		}

		engine.endGroup();
	}
}
