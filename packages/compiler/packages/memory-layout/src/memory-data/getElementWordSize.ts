import { getDataStructure } from './getDataStructure';

import type { MemoryMap } from '../types';

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}
