import { describe, it, expect } from 'vitest';

import deepEqual from './deepEqual';

describe('deepEqual', () => {
	describe('primitives', () => {
		it('should return true for identical primitives', () => {
			expect(deepEqual(1, 1)).toBe(true);
			expect(deepEqual('foo', 'foo')).toBe(true);
			expect(deepEqual(true, true)).toBe(true);
			expect(deepEqual(false, false)).toBe(true);
		});

		it('should return false for different primitives', () => {
			expect(deepEqual(1, 2)).toBe(false);
			expect(deepEqual('foo', 'bar')).toBe(false);
			expect(deepEqual(true, false)).toBe(false);
		});
	});

	describe('null and undefined', () => {
		it('should return true for null === null', () => {
			expect(deepEqual(null, null)).toBe(true);
		});

		it('should return true for undefined === undefined', () => {
			expect(deepEqual(undefined, undefined)).toBe(true);
		});

		it('should return false for null !== undefined', () => {
			expect(deepEqual(null, undefined)).toBe(false);
		});

		it('should return false for null/undefined vs other values', () => {
			expect(deepEqual(null, 0)).toBe(false);
			expect(deepEqual(undefined, 0)).toBe(false);
			expect(deepEqual(null, '')).toBe(false);
			expect(deepEqual(undefined, '')).toBe(false);
		});
	});

	describe('arrays', () => {
		it('should return true for equal arrays', () => {
			expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
			expect(deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
		});

		it('should return false for arrays with different lengths', () => {
			expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
		});

		it('should return false for arrays with different values', () => {
			expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
		});

		it('should handle nested arrays', () => {
			expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
			expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
		});

		it('should return false for array vs non-array', () => {
			expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
		});
	});

	describe('objects', () => {
		it('should return true for equal objects', () => {
			expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
			expect(deepEqual({ x: 'foo', y: 'bar' }, { x: 'foo', y: 'bar' })).toBe(true);
		});

		it('should return true regardless of key order', () => {
			expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
		});

		it('should return false for objects with different keys', () => {
			expect(deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
		});

		it('should return false for objects with different values', () => {
			expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
		});

		it('should return false for objects with different key counts', () => {
			expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
		});

		it('should handle nested objects', () => {
			expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
			expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
		});

		it('should handle objects with null/undefined values', () => {
			expect(deepEqual({ a: null }, { a: null })).toBe(true);
			expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true);
			expect(deepEqual({ a: null }, { a: undefined })).toBe(false);
		});
	});

	describe('complex nested structures', () => {
		it('should handle deeply nested objects and arrays', () => {
			const a = {
				name: 'test',
				config: {
					items: [1, 2, { nested: true }],
					flags: { enabled: true, count: 5 },
				},
			};
			const b = {
				name: 'test',
				config: {
					items: [1, 2, { nested: true }],
					flags: { enabled: true, count: 5 },
				},
			};
			expect(deepEqual(a, b)).toBe(true);
		});

		it('should detect differences in deeply nested structures', () => {
			const a = {
				name: 'test',
				config: {
					items: [1, 2, { nested: true }],
					flags: { enabled: true, count: 5 },
				},
			};
			const b = {
				name: 'test',
				config: {
					items: [1, 2, { nested: false }], // Changed nested value
					flags: { enabled: true, count: 5 },
				},
			};
			expect(deepEqual(a, b)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle empty objects and arrays', () => {
			expect(deepEqual({}, {})).toBe(true);
			expect(deepEqual([], [])).toBe(true);
		});

		it('should return false for different types', () => {
			expect(deepEqual(1, '1')).toBe(false);
			expect(deepEqual(true, 1)).toBe(false);
			expect(deepEqual({}, [])).toBe(false);
		});

		it('should handle same reference', () => {
			const obj = { a: 1 };
			expect(deepEqual(obj, obj)).toBe(true);
		});
	});
});
