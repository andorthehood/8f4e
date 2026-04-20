import { getDataStructure } from './getDataStructure';

export function getPointeeElementWordSize<
	TMemoryItem extends {
		pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
		isPointingToPointer: boolean;
	},
>(memoryMap: Record<string, TMemoryItem>, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 4;
	if (memoryItem.pointeeBaseType === 'float64') return 8;
	if (memoryItem.pointeeBaseType === 'int8') return 1;
	if (memoryItem.pointeeBaseType === 'int16') return 2;
	return 4;
}
