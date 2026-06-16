import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/language-spec';

/**
 * Converts a word offset relative to a byte base into an absolute byte address.
 *
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param wordOffset - word offset value to use.
 * @returns The resolved numeric value.
 */
export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}

/**
 * Returns the final byte address occupied by a word-aligned allocation.
 *
 * @param byteAddress - Byte address where the value should be written.
 * @param wordAlignedSize - word aligned size value to use.
 * @returns The resolved numeric value.
 */
export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	if (wordAlignedSize <= 0) {
		return byteAddress;
	}
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

/**
 * Converts a local word offset into an absolute word offset.
 *
 * @param startingByteAddress - Absolute byte address where layout should begin.
 * @param localWordOffset - Word offset relative to the current allocation start.
 * @returns The resolved numeric value.
 */
export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}

/**
 * Aligns 64-bit allocations to an even absolute word offset.
 *
 * @param absoluteWordOffset - absolute word offset value to use.
 * @param elementWordSize - Word size used to align the absolute offset.
 * @returns The resolved numeric value.
 */
export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}

	return absoluteWordOffset + 1;
}
