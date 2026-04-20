export function getDataStructure<TMemoryItem>(
	memoryMap: Record<string, TMemoryItem>,
	id: string
): TMemoryItem | undefined {
	return memoryMap[id];
}
