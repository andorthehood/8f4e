import { getDataStructure } from './getDataStructure';

import { getEndByteAddress } from '../addresses/getEndByteAddress';

export function getMemoryStringLastByteAddress<TMemoryItem extends { byteAddress: number; wordAlignedSize: number }>(
	memoryMap: Record<string, TMemoryItem>,
	id: string
): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize) : 0;
}
