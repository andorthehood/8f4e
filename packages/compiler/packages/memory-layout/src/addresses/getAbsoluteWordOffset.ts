import { GLOBAL_ALIGNMENT_BOUNDARY } from '../types';

export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}
