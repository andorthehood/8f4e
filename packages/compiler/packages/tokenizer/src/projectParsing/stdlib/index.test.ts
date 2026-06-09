import { describe, expect, it } from 'vitest';

import { resolveBuiltInFunctionInclude } from './index';

describe('resolveBuiltInFunctionInclude', () => {
	it('resolves clamp from std/math/clamp', () => {
		expect(resolveBuiltInFunctionInclude('std/math/clamp')).toEqual({
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
		});
	});

	it('returns undefined for missing includes', () => {
		expect(resolveBuiltInFunctionInclude('std/missing')).toBeUndefined();
		expect(resolveBuiltInFunctionInclude('std/math/missing')).toBeUndefined();
	});
});
