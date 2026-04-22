import { getEndByteAddress } from '../semantic/layoutAddresses';

import type { DataStructure, LocalBinding, MemoryMap } from '../types';

type PointerMetadata =
	| Pick<DataStructure, 'pointeeBaseType' | 'isPointingToPointer'>
	| Pick<LocalBinding, 'pointeeBaseType' | 'isPointingToPointer'>;

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

export function getPointeeElementWordSizeFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	if (pointerMetadata.isPointingToPointer) return 4;
	if (pointerMetadata.pointeeBaseType === 'float64') return 8;
	if (pointerMetadata.pointeeBaseType === 'int8') return 1;
	if (pointerMetadata.pointeeBaseType === 'int16') return 2;
	return 4;
}

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementWordSizeFromMetadata(getDataStructure(memoryMap, id));
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

export function getPointeeElementMaxValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	// double pointers: pointee is a pointer slot (stored as i32)
	if (pointerMetadata.isPointingToPointer) return 2147483647;

	// float64*: max float64
	if (pointerMetadata.pointeeBaseType === 'float64') return 1.7976931348623157e308;

	// int8*: max signed int8
	if (pointerMetadata.pointeeBaseType === 'int8') return 127;

	// int16*: max signed int16
	if (pointerMetadata.pointeeBaseType === 'int16') return 32767;

	// int*: max signed int32
	if (pointerMetadata.pointeeBaseType === 'int') return 2147483647;

	// float*: max float32
	return 3.4028234663852886e38;
}

export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementMaxValueFromMetadata(getDataStructure(memoryMap, id));
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
