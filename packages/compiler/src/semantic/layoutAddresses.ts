import { ALLOCATION_UNIT_BYTE_SIZE } from '@8f4e/compiler-spec';

export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * ALLOCATION_UNIT_BYTE_SIZE;
}

export function getEndByteAddress(byteAddress: number, allocationUnitCount: number): number {
	if (allocationUnitCount <= 0) {
		return byteAddress;
	}
	return byteAddress + (allocationUnitCount - 1) * ALLOCATION_UNIT_BYTE_SIZE;
}

export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / ALLOCATION_UNIT_BYTE_SIZE + localWordOffset;
}

export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}

	return absoluteWordOffset + 1;
}
