import { GLOBAL_ALIGNMENT_BOUNDARY } from '../types';

export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}
