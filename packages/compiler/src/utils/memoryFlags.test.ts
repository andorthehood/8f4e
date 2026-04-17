import { describe, expect, it } from 'vitest';

import getMemoryFlags from './memoryFlags';

describe('getMemoryFlags', () => {
	describe('for int8 base type', () => {
		it('returns correct flags for single-level int8 pointer', () => {
			const flags = getMemoryFlags('int8', 1);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				pointeeBaseType: 'int8',
				isUnsigned: false,
			});
		});

		it('returns correct flags for double-level int8 pointer', () => {
			const flags = getMemoryFlags('int8', 2);
			expect(flags).toEqual({
				isPointingToPointer: true,
				isInteger: true,
				pointeeBaseType: 'int8',
				isUnsigned: false,
			});
		});
	});

	describe('for int16 base type', () => {
		it('returns correct flags for single-level int16 pointer', () => {
			const flags = getMemoryFlags('int16', 1);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				pointeeBaseType: 'int16',
				isUnsigned: false,
			});
		});

		it('returns correct flags for double-level int16 pointer', () => {
			const flags = getMemoryFlags('int16', 2);
			expect(flags).toEqual({
				isPointingToPointer: true,
				isInteger: true,
				pointeeBaseType: 'int16',
				isUnsigned: false,
			});
		});
	});

	describe('for int base type', () => {
		it('returns correct flags for non-pointer int', () => {
			const flags = getMemoryFlags('int', 0);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				isUnsigned: false,
			});
		});

		it('returns correct flags for single-level int pointer', () => {
			const flags = getMemoryFlags('int', 1);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				pointeeBaseType: 'int',
				isUnsigned: false,
			});
		});

		it('returns correct flags for double-level int pointer', () => {
			const flags = getMemoryFlags('int', 2);
			expect(flags).toEqual({
				isPointingToPointer: true,
				isInteger: true,
				pointeeBaseType: 'int',
				isUnsigned: false,
			});
		});
	});

	describe('for float64 base type', () => {
		it('returns correct flags for non-pointer float64', () => {
			const flags = getMemoryFlags('float64', 0);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: false,
				isFloat64: true,
				isUnsigned: false,
			});
		});

		it('returns correct flags for single-level float64 pointer', () => {
			const flags = getMemoryFlags('float64', 1);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				pointeeBaseType: 'float64',
				isUnsigned: false,
			});
		});

		it('returns correct flags for double-level float64 pointer', () => {
			const flags = getMemoryFlags('float64', 2);
			expect(flags).toEqual({
				isPointingToPointer: true,
				isInteger: true,
				pointeeBaseType: 'float64',
				isUnsigned: false,
			});
		});
	});

	describe('for float base type', () => {
		it('returns correct flags for non-pointer float', () => {
			const flags = getMemoryFlags('float', 0);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: false,
				isUnsigned: false,
			});
		});

		it('returns correct flags for single-level float pointer', () => {
			const flags = getMemoryFlags('float', 1);
			expect(flags).toEqual({
				isPointingToPointer: false,
				isInteger: true,
				pointeeBaseType: 'float',
				isUnsigned: false,
			});
		});

		it('returns correct flags for double-level float pointer', () => {
			const flags = getMemoryFlags('float', 2);
			expect(flags).toEqual({
				isPointingToPointer: true,
				isInteger: true,
				pointeeBaseType: 'float',
				isUnsigned: false,
			});
		});
	});
});
