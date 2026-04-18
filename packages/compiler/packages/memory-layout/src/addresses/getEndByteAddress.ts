import { GLOBAL_ALIGNMENT_BOUNDARY } from '../types';

export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	if (wordAlignedSize <= 0) {
		return byteAddress;
	}
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}
