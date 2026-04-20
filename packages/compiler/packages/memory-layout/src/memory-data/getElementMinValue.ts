import { getDataStructure } from './getDataStructure';

export function getElementMinValue<
	TMemoryItem extends { elementWordSize: number; isInteger: boolean; isUnsigned: boolean },
>(memoryMap: Record<string, TMemoryItem>, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;
	if (memoryItem.isInteger) {
		if (memoryItem.isUnsigned) return 0;
		if (memoryItem.elementWordSize === 1) return -128;
		if (memoryItem.elementWordSize === 2) return -32768;
		return -2147483648;
	}
	return memoryItem.elementWordSize === 8 ? -1.7976931348623157e308 : -3.4028234663852886e38;
}
