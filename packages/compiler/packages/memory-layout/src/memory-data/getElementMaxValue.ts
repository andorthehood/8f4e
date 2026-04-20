import { getDataStructure } from './getDataStructure';

export function getElementMaxValue<
	TMemoryItem extends { elementWordSize: number; isInteger: boolean; isUnsigned: boolean },
>(memoryMap: Record<string, TMemoryItem>, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;
	if (memoryItem.isInteger) {
		if (memoryItem.isUnsigned) {
			if (memoryItem.elementWordSize === 1) return 255;
			if (memoryItem.elementWordSize === 2) return 65535;
			return 4294967295;
		}
		if (memoryItem.elementWordSize === 1) return 127;
		if (memoryItem.elementWordSize === 2) return 32767;
		return 2147483647;
	}
	return memoryItem.elementWordSize === 8 ? 1.7976931348623157e308 : 3.4028234663852886e38;
}
