import { describe, expect, it } from 'vitest';

import { resolveBuiltInFunctionIncludes } from './index';

describe('resolveBuiltInFunctionIncludes', () => {
	it('resolves clamp from std/math/clamp', () => {
		expect(resolveBuiltInFunctionIncludes('std/math/clamp')).toEqual([
			{
				code: [
					'function clamp',
					'param int value',
					'param int minValue',
					'param int maxValue',
					'',
					'push value',
					'push minValue',
					'max',
					'push maxValue',
					'min',
					'',
					'functionEnd int',
				],
				source: {
					kind: 'include',
					includeId: 'std/math/clamp',
					symbolName: 'clamp',
				},
			},
			{
				code: [
					'function clamp',
					'param float value',
					'param float minValue',
					'param float maxValue',
					'',
					'push value',
					'push minValue',
					'max',
					'push maxValue',
					'min',
					'',
					'functionEnd float',
				],
				source: {
					kind: 'include',
					includeId: 'std/math/clamp',
					symbolName: 'clamp',
				},
			},
		]);
	});

	it('returns undefined for missing includes', () => {
		expect(resolveBuiltInFunctionIncludes('std/missing')).toBeUndefined();
		expect(resolveBuiltInFunctionIncludes('std/math/missing')).toBeUndefined();
	});
});
