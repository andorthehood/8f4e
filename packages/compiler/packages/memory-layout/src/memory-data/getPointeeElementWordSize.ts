import { getDataStructure } from './getDataStructure';

import type { MemoryMap } from '../types';

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 4;
	if (memoryItem.pointeeBaseType === 'float64') return 8;
	if (memoryItem.pointeeBaseType === 'int8') return 1;
	if (memoryItem.pointeeBaseType === 'int16') return 2;
	return 4;
}
