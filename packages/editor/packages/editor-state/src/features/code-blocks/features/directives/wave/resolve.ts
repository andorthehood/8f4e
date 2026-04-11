import { extractElementCountBase, hasElementCountPrefix } from '@8f4e/tokenizer';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { WaveDirectiveData } from './data';
import type { MemoryIdentifier, WaveSampleType } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

type WaveSampleSpec = {
	elementByteSize: number;
	baseSampleShift: 0 | 1 | 2 | 3;
	sampleType: WaveSampleType;
	minValue: number;
	maxValue: number;
};

function getPointeeElementByteSize(memory: MemoryIdentifier['memory']): number {
	if (!memory.pointeeBaseType) {
		return 0;
	}

	if (memory.isPointingToPointer) {
		return 4;
	}

	if (memory.pointeeBaseType === 'float64') {
		return 8;
	}

	if (memory.pointeeBaseType === 'int8' || memory.pointeeBaseType === 'int8u') {
		return 1;
	}

	if (memory.pointeeBaseType === 'int16' || memory.pointeeBaseType === 'int16u') {
		return 2;
	}

	return 4;
}

function getStartElementByteSize(startAddress: MemoryIdentifier): number {
	if (startAddress.showAddress) {
		return startAddress.memory.elementWordSize;
	}

	return getPointeeElementByteSize(startAddress.memory);
}

function getSampleSpecFromDirectMemory(startAddress: MemoryIdentifier): WaveSampleSpec | undefined {
	const { memory } = startAddress;

	if (memory.elementWordSize === 8 && !memory.isInteger) {
		return { elementByteSize: 8, baseSampleShift: 3, sampleType: 'float64', minValue: -1, maxValue: 1 };
	}

	if (!memory.isInteger) {
		return { elementByteSize: 4, baseSampleShift: 2, sampleType: 'float32', minValue: -1, maxValue: 1 };
	}

	if (memory.elementWordSize === 1) {
		return memory.isUnsigned
			? { elementByteSize: 1, baseSampleShift: 0, sampleType: 'uint8', minValue: 0, maxValue: 255 }
			: { elementByteSize: 1, baseSampleShift: 0, sampleType: 'int8', minValue: -128, maxValue: 127 };
	}

	if (memory.elementWordSize === 2) {
		return memory.isUnsigned
			? { elementByteSize: 2, baseSampleShift: 1, sampleType: 'uint16', minValue: 0, maxValue: 65535 }
			: { elementByteSize: 2, baseSampleShift: 1, sampleType: 'int16', minValue: -32768, maxValue: 32767 };
	}

	return { elementByteSize: 4, baseSampleShift: 2, sampleType: 'int32', minValue: -2147483648, maxValue: 2147483647 };
}

function getSampleSpecFromPointerMemory(startAddress: MemoryIdentifier): WaveSampleSpec | undefined {
	const { memory } = startAddress;

	if (!memory.pointeeBaseType) {
		return undefined;
	}

	if (memory.isPointingToPointer) {
		return { elementByteSize: 4, baseSampleShift: 2, sampleType: 'int32', minValue: -2147483648, maxValue: 2147483647 };
	}

	if (memory.pointeeBaseType === 'float64') {
		return { elementByteSize: 8, baseSampleShift: 3, sampleType: 'float64', minValue: -1, maxValue: 1 };
	}

	if (memory.pointeeBaseType === 'float') {
		return { elementByteSize: 4, baseSampleShift: 2, sampleType: 'float32', minValue: -1, maxValue: 1 };
	}

	if (memory.pointeeBaseType === 'int8') {
		return { elementByteSize: 1, baseSampleShift: 0, sampleType: 'int8', minValue: -128, maxValue: 127 };
	}

	if (memory.pointeeBaseType === 'int8u') {
		return { elementByteSize: 1, baseSampleShift: 0, sampleType: 'uint8', minValue: 0, maxValue: 255 };
	}

	if (memory.pointeeBaseType === 'int16') {
		return { elementByteSize: 2, baseSampleShift: 1, sampleType: 'int16', minValue: -32768, maxValue: 32767 };
	}

	if (memory.pointeeBaseType === 'int16u') {
		return { elementByteSize: 2, baseSampleShift: 1, sampleType: 'uint16', minValue: 0, maxValue: 65535 };
	}

	return { elementByteSize: 4, baseSampleShift: 2, sampleType: 'int32', minValue: -2147483648, maxValue: 2147483647 };
}

function getStartSampleSpec(startAddress: MemoryIdentifier): WaveSampleSpec | undefined {
	if (startAddress.showAddress) {
		return getSampleSpecFromDirectMemory(startAddress);
	}

	return getSampleSpecFromPointerMemory(startAddress);
}

function resolveWaveLength(
	length: WaveDirectiveData['length'],
	moduleId: string,
	state: Parameters<DirectiveWidgetResolver>[1]
): number | MemoryIdentifier | undefined {
	if (typeof length === 'number') {
		return length;
	}

	if (hasElementCountPrefix(length)) {
		const countedMemory = resolveMemoryIdentifier(state, moduleId, extractElementCountBase(length));
		return countedMemory?.memory.numberOfElements;
	}

	return resolveMemoryIdentifier(state, moduleId, length);
}

function resolveWaveDirectiveWidget(
	wave: WaveDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const startAddress = resolveMemoryIdentifier(state, graphicData.moduleId, wave.startAddressMemoryId);
	const length = resolveWaveLength(wave.length, graphicData.moduleId, state);
	const pointer = resolveMemoryIdentifier(state, graphicData.moduleId, wave.pointerMemoryId);
	const sampleSpec = startAddress ? getStartSampleSpec(startAddress) : undefined;
	const elementByteSize = startAddress ? getStartElementByteSize(startAddress) : 0;

	if (!startAddress || !length || !sampleSpec || elementByteSize <= 0) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[wave.lineNumber] ?? wave.lineNumber;

	graphicData.widgets.arrayWaves.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid * 2,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		startAddress,
		elementByteSize,
		inverseElementByteSize: 1 / elementByteSize,
		baseSampleShift: sampleSpec.baseSampleShift,
		length,
		pointer,
		sampleType: sampleSpec.sampleType,
		minValue: sampleSpec.minValue,
		maxValue: sampleSpec.maxValue,
		inverseValueRange:
			sampleSpec.maxValue === sampleSpec.minValue ? 0 : 1 / (sampleSpec.maxValue - sampleSpec.minValue),
	});
}

export function createWaveDirectiveWidgetContribution(wave: WaveDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveWaveDirectiveWidget(wave, graphicData, state, directiveState);
		},
	};
}
