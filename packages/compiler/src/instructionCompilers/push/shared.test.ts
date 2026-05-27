import { describe, expect, it } from 'vitest';

import { kindToStackItem, resolveArgumentValueKind } from './shared';

import { getDereferencedValueKindFromMetadata } from '../../utils/memoryData';

describe('push shared helpers', () => {
	it('resolves value kinds correctly', () => {
		expect(resolveArgumentValueKind({ isInteger: true })).toBe('int32');
		expect(resolveArgumentValueKind({ isInteger: false })).toBe('float32');
		expect(resolveArgumentValueKind({ isInteger: false, isFloat64: true })).toBe('float64');
		expect(getDereferencedValueKindFromMetadata({ pointeeBaseType: 'int' } as never)).toBe('int32');
		expect(getDereferencedValueKindFromMetadata({ pointeeBaseType: 'float64' } as never)).toBe('float64');
		expect(getDereferencedValueKindFromMetadata({ pointeeBaseType: 'float64', pointerDepth: 2 } as never)).toBe(
			'float64'
		);
	});

	it('creates stack items with expected shape', () => {
		expect(kindToStackItem('int32', { isNonZero: true })).toEqual({ kind: 'value', valueType: 'int', isNonZero: true });
		expect(kindToStackItem('float64', { isNonZero: false })).toEqual({
			kind: 'value',
			valueType: 'float64',
			isNonZero: false,
		});
	});
});
