import { describe, expect, it } from 'vitest';

import {
	getDataStructure,
	getDataStructureByteAddress,
	getElementCount,
	getElementMaxValue,
	getElementMinValue,
	getElementWordSize,
	getMemoryStringLastByteAddress,
	getPointeeElementMaxValue,
	getPointeeElementWordSize,
} from './memoryData';

import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { MemoryMap } from '../types';

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

	describe('getPointeeElementWordSize', () => {
		it('returns 4 for int* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'int',
					isPointingToPointer: false,
					type: 'int*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(4);
		});

		it('returns 4 for float* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'float',
					isPointingToPointer: false,
					type: 'float*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(4);
		});

		it('returns 8 for float64* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					isPointingToPointer: false,
					pointeeBaseType: 'float64',
					type: 'float64*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(8);
		});

		it('returns 1 for int8* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					isPointingToPointer: false,
					pointeeBaseType: 'int8',
					type: 'int8*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(1);
		});

		it('returns 2 for int16* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					isPointingToPointer: false,
					pointeeBaseType: 'int16',
					type: 'int16*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(2);
		});

		it('returns 4 for int** double pointer (pointee is a pointer)', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'int',
					isPointingToPointer: true,
					type: 'int**',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(4);
		});

		it('returns 4 for float64** double pointer (pointee is a pointer)', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'float64',
					isPointingToPointer: true,
					type: 'float64**',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'ptr')).toBe(4);
		});

		it('returns 0 for non-pointer identifier', () => {
			const memory: MemoryMap = {
				val: { elementWordSize: 4 } as unknown as MemoryMap[string],
			};
			expect(getPointeeElementWordSize(memory, 'val')).toBe(0);
		});

		it('returns 0 for non-existing identifier', () => {
			expect(getPointeeElementWordSize(mockMemory, 'nonExisting')).toBe(0);
		});
	});

	describe('getElementMaxValue', () => {
		it('returns max value for int32', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(2147483647);
		});

		it('returns max value for int16', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 2,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(32767);
		});

		it('returns max value for int8', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 1,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(127);
		});

		it('returns max finite float32 value', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: false,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(3.4028234663852886e38);
		});

		it('returns max finite float64 value', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 8,
					isInteger: false,
					isFloat64: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(1.7976931348623157e308);
		});

		it('returns max finite float64 value for float64[] buffer (no isFloat64 flag)', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 8,
					isInteger: false,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(1.7976931348623157e308);
		});

		it('returns 0 for non-existing identifier', () => {
			expect(getElementMaxValue(mockMemory, 'nonExisting')).toBe(0);
		});
	});

	describe('getElementMinValue', () => {
		it('returns min value for int32', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-2147483648);
		});

		it('returns min value for int16', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 2,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-32768);
		});

		it('returns min value for int8', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 1,
					isInteger: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-128);
		});

		it('returns lowest finite float32 value', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: false,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-3.4028234663852886e38);
		});

		it('returns lowest finite float64 value', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 8,
					isInteger: false,
					isFloat64: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-1.7976931348623157e308);
		});

		it('returns lowest finite float64 value for float64[] buffer (no isFloat64 flag)', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 8,
					isInteger: false,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(-1.7976931348623157e308);
		});

		it('returns 0 for non-existing identifier', () => {
			expect(getElementMinValue(mockMemory, 'nonExisting')).toBe(0);
		});
	});

	describe('getElementMaxValue with unsigned buffers', () => {
		it('returns max value for unsigned int8', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 1,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(255);
		});

		it('returns max value for unsigned int16', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 2,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(65535);
		});

		it('returns max value for unsigned int32', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMaxValue(memory, 'val')).toBe(4294967295);
		});
	});

	describe('getElementMinValue with unsigned buffers', () => {
		it('returns min value 0 for unsigned int8', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 1,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(0);
		});

		it('returns min value 0 for unsigned int16', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 2,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(0);
		});

		it('returns min value 0 for unsigned int32', () => {
			const memory: MemoryMap = {
				val: {
					elementWordSize: 4,
					isInteger: true,
					isUnsigned: true,
				} as unknown as MemoryMap[string],
			};
			expect(getElementMinValue(memory, 'val')).toBe(0);
		});
	});

	describe('getPointeeElementMaxValue', () => {
		it('returns max int32 value for int* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'int',
					isPointingToPointer: false,
					type: 'int*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(2147483647);
		});

		it('returns max int8 value for int8* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'int8',
					isPointingToPointer: false,
					type: 'int8*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(127);
		});

		it('returns max int16 value for int16* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'int16',
					isPointingToPointer: false,
					type: 'int16*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(32767);
		});

		it('returns max float32 value for float* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'float',
					isPointingToPointer: false,
					type: 'float*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(3.4028234663852886e38);
		});

		it('returns max float64 value for float64* pointer', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					isPointingToPointer: false,
					pointeeBaseType: 'float64',
					type: 'float64*',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(1.7976931348623157e308);
		});

		it('returns max int32 value for float64** pointer (pointee is a pointer slot stored as i32)', () => {
			const memory: MemoryMap = {
				ptr: {
					elementWordSize: 4,
					pointeeBaseType: 'float64',
					isPointingToPointer: true,
					type: 'float64**',
				} as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'ptr')).toBe(2147483647);
		});

		it('returns 0 for non-pointer identifier', () => {
			const memory: MemoryMap = {
				val: { elementWordSize: 4 } as unknown as MemoryMap[string],
			};
			expect(getPointeeElementMaxValue(memory, 'val')).toBe(0);
		});

		it('returns 0 for non-existing identifier', () => {
			expect(getPointeeElementMaxValue(mockMemory, 'nonExisting')).toBe(0);
		});
	});
});
