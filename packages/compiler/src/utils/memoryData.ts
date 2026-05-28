import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';

import { getEndByteAddress } from '../semantic/layoutAddresses';

import type { DataStructure, MemoryMap, MemoryValueKind, PointerLocalBinding, StackAddress } from '@8f4e/compiler-spec';

export type PointerMetadata =
	| Pick<
			DataStructure,
			| 'memoryIndex'
			| 'memoryRegionName'
			| 'pointeeBaseType'
			| 'pointerDepth'
			| 'pointeeMemoryIndex'
			| 'pointeeMemoryRegionName'
			| 'pointeeElementCount'
	  >
	| Pick<
			PointerLocalBinding,
			'pointeeBaseType' | 'pointerDepth' | 'pointeeMemoryIndex' | 'pointeeMemoryRegionName' | 'pointeeElementCount'
	  >
	| {
			pointeeBaseType: NonNullable<StackAddress['pointsTo']>['baseType'];
			pointerDepth: NonNullable<StackAddress['pointsTo']>['pointerDepth'];
			pointeeMemoryIndex: NonNullable<StackAddress['pointsTo']>['memoryIndex'];
			pointeeMemoryRegionName?: NonNullable<StackAddress['pointsTo']>['memoryRegionName'];
			pointeeElementCount?: NonNullable<StackAddress['pointsTo']>['elementCount'];
	  };

function getDeclaredBaseTypeMetadata(memoryItem: DataStructure) {
	if (memoryItem.isInteger) {
		if (memoryItem.elementWordSize === BASE_TYPE_METADATA.int8.wordSize) {
			return memoryItem.isUnsigned ? BASE_TYPE_METADATA.int8u : BASE_TYPE_METADATA.int8;
		}
		if (memoryItem.elementWordSize === BASE_TYPE_METADATA.int16.wordSize) {
			return memoryItem.isUnsigned ? BASE_TYPE_METADATA.int16u : BASE_TYPE_METADATA.int16;
		}
		return BASE_TYPE_METADATA.int;
	}

	return memoryItem.elementWordSize === BASE_TYPE_METADATA.float64.wordSize
		? BASE_TYPE_METADATA.float64
		: BASE_TYPE_METADATA.float;
}

function getPointeeBaseTypeMetadata(pointeeBaseType: NonNullable<PointerMetadata['pointeeBaseType']>) {
	return BASE_TYPE_METADATA[pointeeBaseType];
}

export function getPointerDepthFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return pointerMetadata.pointerDepth;
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
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.allocationUnitCount) : 0;
}

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}

export function getPointeeElementCountFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return pointerMetadata.pointeeElementCount ?? 1;
}

export function getPointeeElementCount(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementCountFromMetadata(getDataStructure(memoryMap, id));
}

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function getPointeeElementWordSizeFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.wordSize;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).wordSize;
}

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementWordSizeFromMetadata(getDataStructure(memoryMap, id));
}

export function getPointeeElementIsIntegerFromMetadata(pointerMetadata: PointerMetadata | undefined): boolean {
	if (!pointerMetadata?.pointeeBaseType) return false;
	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.isInteger;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).isInteger;
}

export function getPointeeValueKindFromMetadata(pointerMetadata: PointerMetadata | undefined): MemoryValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (getPointeeElementIsIntegerFromMetadata(pointerMetadata)) return 'int32';
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).valueKind;
}

export function getDereferencedValueWordSizeFromMetadata(
	pointerMetadata: PointerMetadata | undefined,
	dereferenceDepth = getPointerDepthFromMetadata(pointerMetadata)
): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	if (dereferenceDepth < getPointerDepthFromMetadata(pointerMetadata)) return BASE_TYPE_METADATA.pointer.wordSize;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).wordSize;
}

export function getDereferencedValueKindFromMetadata(
	pointerMetadata: PointerMetadata | undefined,
	dereferenceDepth = getPointerDepthFromMetadata(pointerMetadata)
): MemoryValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (dereferenceDepth < getPointerDepthFromMetadata(pointerMetadata)) return BASE_TYPE_METADATA.pointer.valueKind;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).valueKind;
}

export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	const metadata = getDeclaredBaseTypeMetadata(memoryItem);
	return memoryItem.isUnsigned ? (metadata.unsignedMax ?? metadata.max) : metadata.max;
}

export function getPointeeElementMaxValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.max;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).max;
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

export function getPointeeElementMinValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.min;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).min;
}

export function getPointeeElementMinValue(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementMinValueFromMetadata(getDataStructure(memoryMap, id));
}
