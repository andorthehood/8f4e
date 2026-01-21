import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { MemoryMap } from '../types';

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap[id];
}

export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	if (memoryItem.isInteger) {
		const elementWordSize = memoryItem.elementWordSize;
		if (elementWordSize === 1) {
			return 127;
		} else if (elementWordSize === 2) {
			return 32767;
		} else {
			return 2147483647;
		}
	} else {
		return 3.4028234663852886e38;
	}
}

export function getElementMinValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;

	if (memoryItem.isInteger) {
		const elementWordSize = memoryItem.elementWordSize;
		if (elementWordSize === 1) {
			return -128;
		} else if (elementWordSize === 2) {
			return -32768;
		} else {
			return -2147483648;
		}
	} else {
		return -3.4028234663852886e38;
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('memoryData utilities', () => {
		const mockMemory: MemoryMap = {
			myVar: {
				byteAddress: 100,
				wordAlignedSize: 5,
				numberOfElements: 10,
				elementWordSize: 4,
			} as unknown as MemoryMap[string],
			myVar2: {
				byteAddress: 0,
				wordAlignedSize: 1,
				numberOfElements: 1,
				elementWordSize: 4,
			} as unknown as MemoryMap[string],
		};

		describe('getDataStructure', () => {
			it('returns the memory item for existing identifier', () => {
				expect(getDataStructure(mockMemory, 'myVar')).toBe(mockMemory.myVar);
			});

			it('returns undefined for non-existing identifier', () => {
				expect(getDataStructure(mockMemory, 'nonExisting')).toBeUndefined();
			});
		});

		describe('getDataStructureByteAddress', () => {
			it('returns byte address for existing identifier', () => {
				expect(getDataStructureByteAddress(mockMemory, 'myVar')).toBe(100);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getDataStructureByteAddress(mockMemory, 'nonExisting')).toBe(0);
			});

			it('returns 0 when byte address is 0', () => {
				expect(getDataStructureByteAddress(mockMemory, 'myVar2')).toBe(0);
			});
		});

		describe('getMemoryStringLastByteAddress', () => {
			it('calculates last byte address correctly', () => {
				const expected = 100 + (5 - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
				expect(getMemoryStringLastByteAddress(mockMemory, 'myVar')).toBe(expected);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getMemoryStringLastByteAddress(mockMemory, 'nonExisting')).toBe(0);
			});
		});

		describe('getElementCount', () => {
			it('returns element count for existing identifier', () => {
				expect(getElementCount(mockMemory, 'myVar')).toBe(10);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getElementCount(mockMemory, 'nonExisting')).toBe(0);
			});
		});

		describe('getElementWordSize', () => {
			it('returns element word size for existing identifier', () => {
				expect(getElementWordSize(mockMemory, 'myVar')).toBe(4);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getElementWordSize(mockMemory, 'nonExisting')).toBe(0);
			});
		});

		describe('getElementMaxValue', () => {
			it('returns max value for int32', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 4, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMaxValue(memory, 'val')).toBe(2147483647);
			});

			it('returns max value for int16', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 2, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMaxValue(memory, 'val')).toBe(32767);
			});

			it('returns max value for int8', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 1, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMaxValue(memory, 'val')).toBe(127);
			});

			it('returns max finite float32 value', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 4, isInteger: false } as unknown as MemoryMap[string],
				};
				expect(getElementMaxValue(memory, 'val')).toBe(3.4028234663852886e38);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getElementMaxValue(mockMemory, 'nonExisting')).toBe(0);
			});
		});

		describe('getElementMinValue', () => {
			it('returns min value for int32', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 4, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMinValue(memory, 'val')).toBe(-2147483648);
			});

			it('returns min value for int16', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 2, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMinValue(memory, 'val')).toBe(-32768);
			});

			it('returns min value for int8', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 1, isInteger: true } as unknown as MemoryMap[string],
				};
				expect(getElementMinValue(memory, 'val')).toBe(-128);
			});

			it('returns lowest finite float32 value', () => {
				const memory: MemoryMap = {
					val: { elementWordSize: 4, isInteger: false } as unknown as MemoryMap[string],
				};
				expect(getElementMinValue(memory, 'val')).toBe(-3.4028234663852886e38);
			});

			it('returns 0 for non-existing identifier', () => {
				expect(getElementMinValue(mockMemory, 'nonExisting')).toBe(0);
			});
		});
	});
}
