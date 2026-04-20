import { getDataStructure } from './getDataStructure';

export function getElementCount<TMemoryItem extends { numberOfElements: number }>(
	memoryMap: Record<string, TMemoryItem>,
	id: string
): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}
