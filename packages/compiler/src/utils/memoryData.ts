import { getEndByteAddress } from '../semantic/layoutAddresses';

import type { MemoryMap } from '../types';

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap[id];
}

export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize) : 0;
}

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 4;
	if (memoryItem.pointeeBaseType === 'float64') return 8;
	if (memoryItem.pointeeBaseType === 'int8') return 1;
	if (memoryItem.pointeeBaseType === 'int16') return 2;
	return 4;
}

export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	if (memoryItem.isInteger) {
		const elementWordSize = memoryItem.elementWordSize;
		if (memoryItem.isUnsigned) {
			if (elementWordSize === 1) {
				return 255;
			} else if (elementWordSize === 2) {
				return 65535;
			} else {
				return 4294967295;
			}
		} else {
			if (elementWordSize === 1) {
				return 127;
			} else if (elementWordSize === 2) {
				return 32767;
			} else {
				return 2147483647;
			}
		}
	} else if (!memoryItem.isInteger && memoryItem.elementWordSize === 8) {
		return 1.7976931348623157e308;
	} else {
		return 3.4028234663852886e38;
	}
}

export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;

	// double pointers: pointee is a pointer slot (stored as i32)
	if (memoryItem.isPointingToPointer) return 2147483647;

	// float64*: max float64
	if (memoryItem.pointeeBaseType === 'float64') return 1.7976931348623157e308;

	// int8*: max signed int8
	if (memoryItem.pointeeBaseType === 'int8') return 127;

	// int16*: max signed int16
	if (memoryItem.pointeeBaseType === 'int16') return 32767;

	// int*: max signed int32
	if (memoryItem.pointeeBaseType === 'int') return 2147483647;

	// float*: max float32
	return 3.4028234663852886e38;
}

export function getElementMinValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	if (memoryItem.isInteger) {
		const elementWordSize = memoryItem.elementWordSize;
		if (memoryItem.isUnsigned) {
			return 0;
		} else {
			if (elementWordSize === 1) {
				return -128;
			} else if (elementWordSize === 2) {
				return -32768;
			} else {
				return -2147483648;
			}
		}
	} else if (!memoryItem.isInteger && memoryItem.elementWordSize === 8) {
		return -1.7976931348623157e308;
	} else {
		return -3.4028234663852886e38;
	}
}
