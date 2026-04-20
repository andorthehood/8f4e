import { getDataStructure } from './getDataStructure';

export function getElementWordSize<TMemoryItem extends { elementWordSize: number }>(
	memoryMap: Record<string, TMemoryItem>,
	id: string
): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}
