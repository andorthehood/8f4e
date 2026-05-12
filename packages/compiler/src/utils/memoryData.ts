import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';

import { getEndByteAddress } from '../semantic/layoutAddresses';

import type { BaseMemoryType, DataStructure, LocalBinding, MemoryMap, MemoryValueKind } from '@8f4e/compiler-spec';

export type PointerMetadata =
	| Pick<DataStructure, 'pointeeBaseType' | 'isPointingToPointer'>
	| Pick<LocalBinding, 'pointeeBaseType' | 'isPointingToPointer'>;

export type PointeeValueKind = MemoryValueKind;

function getDeclaredBaseTypeMetadata(memoryItem: DataStructure) {
	if (memoryItem.isInteger) {
		if (memoryItem.elementWordSize === BASE_TYPE_METADATA.int8.wordSize) {
			return BASE_TYPE_METADATA.int8;
		}
		if (memoryItem.elementWordSize === BASE_TYPE_METADATA.int16.wordSize) {
			return BASE_TYPE_METADATA.int16;
		}
		return BASE_TYPE_METADATA.int;
	}

	return memoryItem.elementWordSize === BASE_TYPE_METADATA.float64.wordSize
		? BASE_TYPE_METADATA.float64
		: BASE_TYPE_METADATA.float;
}

function isBaseMemoryType(pointeeBaseType: PointerMetadata['pointeeBaseType']): pointeeBaseType is BaseMemoryType {
	return (
		pointeeBaseType === 'int8' ||
		pointeeBaseType === 'int16' ||
		pointeeBaseType === 'int' ||
		pointeeBaseType === 'float' ||
		pointeeBaseType === 'float64'
	);
}

function getPointeeBaseTypeMetadata(pointeeBaseType: PointerMetadata['pointeeBaseType']) {
	return isBaseMemoryType(pointeeBaseType) ? BASE_TYPE_METADATA[pointeeBaseType] : undefined;
}

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
	if (pointerMetadata.isPointingToPointer) return BASE_TYPE_METADATA.pointer.wordSize;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType)?.wordSize ?? BASE_TYPE_METADATA.int.wordSize;
}

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementWordSizeFromMetadata(getDataStructure(memoryMap, id));
}

export function getPointeeElementIsIntegerFromMetadata(pointerMetadata: PointerMetadata | undefined): boolean {
	if (!pointerMetadata?.pointeeBaseType) return false;
	if (pointerMetadata.isPointingToPointer) return BASE_TYPE_METADATA.pointer.isInteger;
	const metadata = getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType);
	return metadata
		? metadata.isInteger
		: pointerMetadata.pointeeBaseType !== 'float64' && pointerMetadata.pointeeBaseType !== 'float';
}

export function getPointeeValueKindFromMetadata(pointerMetadata: PointerMetadata | undefined): PointeeValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (getPointeeElementIsIntegerFromMetadata(pointerMetadata)) return 'int32';
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType)?.valueKind ?? BASE_TYPE_METADATA.float.valueKind;
}

export function getDereferencedValueWordSizeFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType)?.wordSize ?? BASE_TYPE_METADATA.int.wordSize;
}

export function getDereferencedValueKindFromMetadata(pointerMetadata: PointerMetadata | undefined): PointeeValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType)?.valueKind ?? BASE_TYPE_METADATA.float.valueKind;
}

export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	const metadata = getDeclaredBaseTypeMetadata(memoryItem);
	return memoryItem.isUnsigned ? (metadata.unsignedMax ?? metadata.max) : metadata.max;
}

export function getPointeeElementMaxValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	if (pointerMetadata.isPointingToPointer) return BASE_TYPE_METADATA.pointer.max;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType)?.max ?? BASE_TYPE_METADATA.float.max;
}

export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementMaxValueFromMetadata(getDataStructure(memoryMap, id));
}

export function getElementMinValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	const metadata = getDeclaredBaseTypeMetadata(memoryItem);
	return memoryItem.isUnsigned ? (metadata.unsignedMin ?? metadata.min) : metadata.min;
}
