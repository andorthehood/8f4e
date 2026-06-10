import { describe, expect, it } from 'vitest';

import { resolveFunctionIncludeSource } from './functionIncludes';

describe('resolveFunctionIncludeSource', () => {
	it('splits a resolved include source into function blocks with include metadata', () => {
		expect(
			resolveFunctionIncludeSource(
				'std/test/helpers',
				[
					'function first',
					'param int value',
					'functionEnd int',
					'',
					'function second',
					'param float value',
					'functionEnd float',
					'',
				].join('\n')
			)
		).toEqual([
			{
				code: ['function first', 'param int value', 'functionEnd int'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: 'first',
				},
			},
			{
				code: ['function second', 'param float value', 'functionEnd float'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: 'second',
				},
			},
		]);
	});
});
