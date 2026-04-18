import type { MemoryMap } from '../types';

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap[id];
}
