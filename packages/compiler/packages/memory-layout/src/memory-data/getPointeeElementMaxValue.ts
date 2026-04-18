import { getDataStructure } from './getDataStructure';

import type { MemoryMap } from '../types';

export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 2147483647;
	if (memoryItem.pointeeBaseType === 'float64') return 1.7976931348623157e308;
	if (memoryItem.pointeeBaseType === 'int8') return 127;
	if (memoryItem.pointeeBaseType === 'int16') return 32767;
	if (memoryItem.pointeeBaseType === 'int') return 2147483647;
	return 3.4028234663852886e38;
}
