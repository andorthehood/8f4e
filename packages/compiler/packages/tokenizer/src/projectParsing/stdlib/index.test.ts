import { describe, expect, it } from 'vitest';

import { resolveBuiltInFunctionIncludes } from './index';

const includeSource = {
	hasChanged: {
		int: [
			'function hasChanged',
			'#impure',
			'param int currentValue',
			'param int* previousValue',
			'',
			'push currentValue',
			'push *previousValue',
			'notEqual',
			'push previousValue',
			'push currentValue',
			'store',
			'',
			'functionEnd int',
		],
		float: [
			'function hasChanged',
			'#impure',
			'param float currentValue',
			'param float* previousValue',
			'',
			'push currentValue',
			'push previousValue',
			'loadFloat',
			'notEqual',
			'push previousValue',
			'push currentValue',
			'store',
			'',
			'functionEnd int',
		],
	},
	risingEdge: {
		int: [
			'function risingEdge',
			'#impure',
			'param int currentValue',
			'param int* previousValue',
			'',
			'push currentValue',
			'push *previousValue',
			'greaterThan',
			'push previousValue',
			'push currentValue',
			'store',
			'',
			'functionEnd int',
		],
		float: [
			'function risingEdge',
			'#impure',
			'param float currentValue',
			'param float* previousValue',
			'',
			'push currentValue',
			'push previousValue',
			'loadFloat',
			'greaterThan',
			'push previousValue',
			'push currentValue',
			'store',
			'',
			'functionEnd int',
		],
	},
};

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

	it('resolves risingEdge from std/events/risingEdge', () => {
		expect(resolveBuiltInFunctionIncludes('std/events/risingEdge')).toEqual([
			{
				code: includeSource.risingEdge.int,
				source: {
					kind: 'include',
					includeId: 'std/events/risingEdge',
					symbolName: 'risingEdge',
				},
			},
			{
				code: includeSource.risingEdge.float,
				source: {
					kind: 'include',
					includeId: 'std/events/risingEdge',
					symbolName: 'risingEdge',
				},
			},
		]);
	});

	it('resolves hasChanged from std/events/hasChanged', () => {
		expect(resolveBuiltInFunctionIncludes('std/events/hasChanged')).toEqual([
			{
				code: includeSource.hasChanged.int,
				source: {
					kind: 'include',
					includeId: 'std/events/hasChanged',
					symbolName: 'hasChanged',
				},
			},
			{
				code: includeSource.hasChanged.float,
				source: {
					kind: 'include',
					includeId: 'std/events/hasChanged',
					symbolName: 'hasChanged',
				},
			},
		]);
	});

	it('returns undefined for missing includes', () => {
		expect(resolveBuiltInFunctionIncludes('std/missing')).toBeUndefined();
		expect(resolveBuiltInFunctionIncludes('std/math/missing')).toBeUndefined();
	});
});
