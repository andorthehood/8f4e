import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	if (wordAlignedSize <= 0) {
		return byteAddress;
	}
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getModuleEndByteAddress(startingByteAddress: number, wordAlignedSize: number): number {
	return getEndByteAddress(startingByteAddress, wordAlignedSize);
}

export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}

export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}

	return absoluteWordOffset + 1;
}
