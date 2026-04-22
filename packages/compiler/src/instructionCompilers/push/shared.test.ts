import { describe, expect, it } from 'vitest';

import { kindToStackItem, resolveArgumentValueKind, resolvePointerTargetValueKind } from './shared';

describe('push shared helpers', () => {
	it('resolves value kinds correctly', () => {
		expect(resolveArgumentValueKind({ isInteger: true })).toBe('int32');
		expect(resolveArgumentValueKind({ isInteger: false })).toBe('float32');
		expect(resolveArgumentValueKind({ isInteger: false, isFloat64: true })).toBe('float64');
		expect(resolvePointerTargetValueKind({ pointeeBaseType: 'int' } as never)).toBe('int32');
		expect(resolvePointerTargetValueKind({ pointeeBaseType: 'float64' } as never)).toBe('float64');
		expect(resolvePointerTargetValueKind({ pointeeBaseType: 'float64', isPointingToPointer: true } as never)).toBe(
			'float64'
		);
	});

	it('creates stack items with expected shape', () => {
		expect(kindToStackItem('int32', { isNonZero: true })).toEqual({
			isInteger: true,
			isNonZero: true,
		});
		expect(kindToStackItem('float64', { isNonZero: false })).toEqual({
			isInteger: false,
			isFloat64: true,
			isNonZero: false,
		});
	});
});
