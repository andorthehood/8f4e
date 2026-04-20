import { getDataStructure } from './getDataStructure';

export function getDataStructureByteAddress<TMemoryItem extends { byteAddress: number }>(
	memoryMap: Record<string, TMemoryItem>,
	id: string
): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}
