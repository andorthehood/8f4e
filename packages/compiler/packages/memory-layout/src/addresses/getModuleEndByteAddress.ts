import { getEndByteAddress } from './getEndByteAddress';

export function getModuleEndByteAddress(startingByteAddress: number, wordAlignedSize: number): number {
	return getEndByteAddress(startingByteAddress, wordAlignedSize);
}
