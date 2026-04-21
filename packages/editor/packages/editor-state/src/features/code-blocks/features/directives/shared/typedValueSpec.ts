import { extractElementCountBase, hasElementCountPrefix } from '@8f4e/tokenizer';

import type { MemoryIdentifier, State, TypedValueKind } from '~/types';

import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export type TypedValueSpec = {
	baseSampleShift: 0 | 1 | 2 | 3;
	valueType: TypedValueKind;
	minValue: number;
	maxValue: number;
	elementByteSize: number;
};

function getSampleSpecFromDirectMemory(startAddress: MemoryIdentifier): TypedValueSpec | undefined {
	const { memory } = startAddress;

	if (memory.elementWordSize === 8 && !memory.isInteger) {
		return { elementByteSize: 8, baseSampleShift: 3, valueType: 'float64', minValue: -1, maxValue: 1 };
	}

	if (!memory.isInteger) {
		return { elementByteSize: 4, baseSampleShift: 2, valueType: 'float32', minValue: -1, maxValue: 1 };
	}

	if (memory.elementWordSize === 1) {
		return memory.isUnsigned
			? { elementByteSize: 1, baseSampleShift: 0, valueType: 'uint8', minValue: 0, maxValue: 255 }
			: { elementByteSize: 1, baseSampleShift: 0, valueType: 'int8', minValue: -128, maxValue: 127 };
	}

	if (memory.elementWordSize === 2) {
		return memory.isUnsigned
			? { elementByteSize: 2, baseSampleShift: 1, valueType: 'uint16', minValue: 0, maxValue: 65535 }
			: { elementByteSize: 2, baseSampleShift: 1, valueType: 'int16', minValue: -32768, maxValue: 32767 };
	}

	return {
		elementByteSize: 4,
		baseSampleShift: 2,
		valueType: 'int32',
		minValue: -2147483648,
		maxValue: 2147483647,
	};
}

function getSampleSpecFromPointerMemory(startAddress: MemoryIdentifier): TypedValueSpec | undefined {
	const { memory } = startAddress;

	if (!memory.pointeeBaseType) {
		return undefined;
	}

	if (memory.isPointingToPointer) {
		return {
			elementByteSize: 4,
			baseSampleShift: 2,
			valueType: 'int32',
			minValue: -2147483648,
			maxValue: 2147483647,
		};
	}

	if (memory.pointeeBaseType === 'float64') {
		return { elementByteSize: 8, baseSampleShift: 3, valueType: 'float64', minValue: -1, maxValue: 1 };
	}

	if (memory.pointeeBaseType === 'float') {
		return { elementByteSize: 4, baseSampleShift: 2, valueType: 'float32', minValue: -1, maxValue: 1 };
	}

	if (memory.pointeeBaseType === 'int8') {
		return { elementByteSize: 1, baseSampleShift: 0, valueType: 'int8', minValue: -128, maxValue: 127 };
	}

	if (memory.pointeeBaseType === 'int8u') {
		return { elementByteSize: 1, baseSampleShift: 0, valueType: 'uint8', minValue: 0, maxValue: 255 };
	}

	if (memory.pointeeBaseType === 'int16') {
		return { elementByteSize: 2, baseSampleShift: 1, valueType: 'int16', minValue: -32768, maxValue: 32767 };
	}

	if (memory.pointeeBaseType === 'int16u') {
		return { elementByteSize: 2, baseSampleShift: 1, valueType: 'uint16', minValue: 0, maxValue: 65535 };
	}

	return {
		elementByteSize: 4,
		baseSampleShift: 2,
		valueType: 'int32',
		minValue: -2147483648,
		maxValue: 2147483647,
	};
}

export function resolveTypedValueSpec(startAddress: MemoryIdentifier): TypedValueSpec | undefined {
	if (startAddress.showAddress) {
		return getSampleSpecFromDirectMemory(startAddress);
	}

	return getSampleSpecFromPointerMemory(startAddress);
}

export function resolveDirectOrPointerTypedValueSpec(startAddress: MemoryIdentifier): TypedValueSpec | undefined {
	if (startAddress.showAddress) {
		return getSampleSpecFromDirectMemory(startAddress);
	}

	return getSampleSpecFromPointerMemory(startAddress) ?? getSampleSpecFromDirectMemory(startAddress);
}

export function resolveElementCount(
	length: string | number | undefined,
	moduleId: string,
	state: State
): number | MemoryIdentifier | undefined {
	if (typeof length === 'number') {
		return length > 0 ? length : undefined;
	}

	if (!length) {
		return undefined;
	}

	if (hasElementCountPrefix(length)) {
		const countedMemory = resolveMemoryIdentifier(state, moduleId, extractElementCountBase(length));
		return countedMemory?.memory.numberOfElements;
	}

	return resolveMemoryIdentifier(state, moduleId, length);
}
