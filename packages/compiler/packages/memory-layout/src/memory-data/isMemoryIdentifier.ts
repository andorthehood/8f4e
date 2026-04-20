export function isMemoryIdentifier<TMemoryItem>(memoryMap: Record<string, TMemoryItem>, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}
