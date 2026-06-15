import type { DataStructure, MemoryMap, MemoryValueKind, PointerLocalBinding, StackAddress } from '@8f4e/compiler-spec';
import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';
import { getEndByteAddress } from './layoutAddresses';

/** Common pointer metadata shape shared by memory declarations, locals, and stack address items. */
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

/**
 * Reads pointer depth from metadata, returning zero when the item is not pointer-like.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointerDepthFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return pointerMetadata.pointerDepth;
}

/**
 * Returns a declared memory item's byte address, or zero when the id is absent.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	return memoryItem ? memoryItem.byteAddress : 0;
}

/**
 * Returns the inclusive last byte address of a memory item's aligned storage, or zero when absent.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize) : 0;
}

/**
 * Returns the declared element count for a memory item, or zero when absent.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	return memoryItem ? memoryItem.numberOfElements : 0;
}

/**
 * Returns the pointer target element count from metadata, defaulting scalar pointees to one.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementCountFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return pointerMetadata.pointeeElementCount ?? 1;
}

/**
 * Returns the pointer target element count for a memory item, or zero when it is not pointer-like.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementCount(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementCountFromMetadata(memoryMap[id]);
}

/**
 * Returns the declared element word size for a memory item, or zero when absent.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	return memoryItem ? memoryItem.elementWordSize : 0;
}

/**
 * Returns the word size of the value reached by one pointer dereference.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementWordSizeFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.wordSize;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).wordSize;
}

/**
 * Returns the pointee element word size for a memory item, or zero when it is not pointer-like.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementWordSizeFromMetadata(memoryMap[id]);
}

/**
 * Returns whether the value reached by one pointer dereference is integer-like.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns Whether the check succeeds.
 */
export function getPointeeElementIsIntegerFromMetadata(pointerMetadata: PointerMetadata | undefined): boolean {
	if (!pointerMetadata?.pointeeBaseType) return false;
	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.isInteger;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).isInteger;
}

/**
 * Resolves the memory value kind produced by dereferencing pointer metadata once.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The computed result.
 */
export function getPointeeValueKindFromMetadata(pointerMetadata: PointerMetadata | undefined): MemoryValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (getPointeeElementIsIntegerFromMetadata(pointerMetadata)) return 'int32';
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).valueKind;
}

/**
 * Resolves the word size produced after dereferencing pointer metadata to the requested depth.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @param dereferenceDepth - Pointer dereference depth requested by the instruction.
 * @returns The resolved numeric value.
 */
export function getDereferencedValueWordSizeFromMetadata(
	pointerMetadata: PointerMetadata | undefined,
	dereferenceDepth = getPointerDepthFromMetadata(pointerMetadata)
): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	if (dereferenceDepth < getPointerDepthFromMetadata(pointerMetadata)) return BASE_TYPE_METADATA.pointer.wordSize;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).wordSize;
}

/**
 * Resolves the memory value kind produced after dereferencing pointer metadata to the requested depth.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @param dereferenceDepth - Pointer dereference depth requested by the instruction.
 * @returns The computed result.
 */
export function getDereferencedValueKindFromMetadata(
	pointerMetadata: PointerMetadata | undefined,
	dereferenceDepth = getPointerDepthFromMetadata(pointerMetadata)
): MemoryValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (dereferenceDepth < getPointerDepthFromMetadata(pointerMetadata)) return BASE_TYPE_METADATA.pointer.valueKind;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).valueKind;
}

/**
 * Returns the maximum numeric value allowed by a declared memory item's base type.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	if (!memoryItem) return 0;

	const metadata = getDeclaredBaseTypeMetadata(memoryItem);
	return memoryItem.isUnsigned ? (metadata.unsignedMax ?? metadata.max) : metadata.max;
}

/**
 * Returns the maximum numeric value allowed by pointer target metadata.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMaxValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.max;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).max;
}

/**
 * Returns the maximum numeric value allowed by a memory item's pointer target.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementMaxValueFromMetadata(memoryMap[id]);
}

/**
 * Returns the minimum numeric value allowed by a declared memory item's base type.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getElementMinValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = memoryMap[id];
	if (!memoryItem) return 0;

	const metadata = getDeclaredBaseTypeMetadata(memoryItem);
	return memoryItem.isUnsigned ? (metadata.unsignedMin ?? metadata.min) : metadata.min;
}

/**
 * Returns the minimum numeric value allowed by pointer target metadata.
 *
 * @param pointerMetadata - Pointer metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMinValueFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;

	if (getPointerDepthFromMetadata(pointerMetadata) > 1) return BASE_TYPE_METADATA.pointer.min;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).min;
}

/**
 * Returns the minimum numeric value allowed by a memory item's pointer target.
 *
 * @param memoryMap - Memory lookup that may contain the requested id.
 * @param id - Identifier of the memory item to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMinValue(memoryMap: MemoryMap, id: string): number {
	return getPointeeElementMinValueFromMetadata(memoryMap[id]);
}
