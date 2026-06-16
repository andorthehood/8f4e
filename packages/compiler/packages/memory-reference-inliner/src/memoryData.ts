import type {
	MemoryPointerMetadata,
	MemoryValueKind,
	PlannedMemoryDeclaration,
	PointerLocalBinding,
	StackAddress,
} from '@8f4e/compiler-spec';
import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';
import { getEndByteAddress } from './layoutAddresses';

/** Common pointer metadata shape shared by memory declarations, locals, and stack address items. */
export type PointerMetadata =
	| (Pick<PlannedMemoryDeclaration, 'memoryIndex' | 'memoryRegionName' | 'pointeeBaseType' | 'pointerDepth'> &
			Partial<MemoryPointerMetadata>)
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

function getDeclaredBaseTypeMetadata(
	memoryItem: Pick<PlannedMemoryDeclaration, 'elementWordSize' | 'isInteger' | 'isUnsigned'>
) {
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
 * Returns a declared memory item's byte address.
 *
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getMemoryByteAddress(memoryItem: PlannedMemoryDeclaration): number {
	return memoryItem.byteAddress;
}

/**
 * Returns the inclusive last byte address of a memory item's aligned storage.
 *
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getMemoryStringLastByteAddress(memoryItem: PlannedMemoryDeclaration): number {
	return getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize);
}

/**
 * Returns the declared element count for a memory item.
 *
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getElementCount(memoryItem: PlannedMemoryDeclaration): number {
	return memoryItem.numberOfElements;
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
 * @param memoryItem - Pointer declaration metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementCount(memoryItem: PointerMetadata | undefined): number {
	return getPointeeElementCountFromMetadata(memoryItem);
}

/**
 * Returns the declared element word size for a memory item.
 *
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getElementWordSize(memoryItem: PlannedMemoryDeclaration): number {
	return memoryItem.elementWordSize;
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
 * @param memoryItem - Pointer declaration metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementWordSize(memoryItem: PointerMetadata | undefined): number {
	return getPointeeElementWordSizeFromMetadata(memoryItem);
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
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getElementMaxValue(memoryItem: PlannedMemoryDeclaration): number {
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
 * @param memoryItem - Pointer declaration metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMaxValue(memoryItem: PointerMetadata | undefined): number {
	return getPointeeElementMaxValueFromMetadata(memoryItem);
}

/**
 * Returns the minimum numeric value allowed by a declared memory item's base type.
 *
 * @param memoryItem - Memory declaration to inspect.
 * @returns The resolved numeric value.
 */
export function getElementMinValue(memoryItem: PlannedMemoryDeclaration): number {
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
 * @param memoryItem - Pointer declaration metadata to inspect.
 * @returns The resolved numeric value.
 */
export function getPointeeElementMinValue(memoryItem: PointerMetadata | undefined): number {
	return getPointeeElementMinValueFromMetadata(memoryItem);
}
