import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';

/** Converts a word offset relative to a byte base into an absolute byte address. */
export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}

/** Returns the final byte address occupied by a word-aligned allocation. */
export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	if (wordAlignedSize <= 0) {
		return byteAddress;
	}
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

/** Converts a local word offset into an absolute word offset. */
export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}

/** Aligns 64-bit allocations to an even absolute word offset. */
export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}

	return absoluteWordOffset + 1;
}
