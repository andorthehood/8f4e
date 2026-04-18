import { getDataStructure } from './getDataStructure';

import { getEndByteAddress } from '../addresses/getEndByteAddress';

import type { MemoryMap } from '../types';

export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize) : 0;
}
