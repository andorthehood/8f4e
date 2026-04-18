import { getDataStructure } from './getDataStructure';

import type { MemoryMap } from '../types';

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}
