import { describe, expect, it } from 'vitest';

import { resolveFunctionIncludeSource } from './functionIncludes';

describe('resolveFunctionIncludeSource', () => {
	it('splits exported include functions and prefixes internal helper functions', () => {
		expect(
			resolveFunctionIncludeSource(
				'std/test/helpers',
				[
					'function first',
					'#export',
					'call helper',
					'functionEnd int',
					'',
					'function helper',
					'param int value',
					'functionEnd int',
					'',
				].join('\n')
			)
		).toEqual([
			{
				code: ['function first', '', 'call __8f4e_std_test_helpers__helper', 'functionEnd int'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: 'first',
				},
			},
			{
				code: ['function __8f4e_std_test_helpers__helper', 'param int value', 'functionEnd int'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: '__8f4e_std_test_helpers__helper',
				},
			},
		]);
	});

	it('supports include-local export aliases', () => {
		expect(
			resolveFunctionIncludeSource(
				'std/test/helpers',
				['function internalName', '#export publicName', 'functionEnd'].join('\n')
			)
		).toEqual([
			{
				code: ['function publicName', '', 'functionEnd'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: 'publicName',
				},
			},
		]);
	});

	it('allows partially exported overload families when calls are unambiguous', () => {
		expect(
			resolveFunctionIncludeSource(
				'std/test/helpers',
				[
					'function convert',
					'#export',
					'param int value',
					'functionEnd int',
					'',
					'function convert',
					'param float value',
					'functionEnd float',
				].join('\n')
			)
		).toEqual([
			{
				code: ['function convert', '', 'param int value', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/test/helpers', symbolName: 'convert' },
			},
			{
				code: ['function __8f4e_std_test_helpers__convert', 'param float value', 'functionEnd float'],
				source: {
					kind: 'include',
					includeId: 'std/test/helpers',
					symbolName: '__8f4e_std_test_helpers__convert',
				},
			},
		]);
	});

	it('throws when include source has no exported functions', () => {
		expect(() =>
			resolveFunctionIncludeSource('std/test/helpers', ['function helper', 'functionEnd int'].join('\n'))
		).toThrow('include "std/test/helpers" must export at least one function');
	});

	it('throws when mixed public/internal overload calls cannot be rewritten unambiguously', () => {
		expect(() =>
			resolveFunctionIncludeSource(
				'std/test/helpers',
				[
					'function caller',
					'#export',
					'push 1',
					'call convert',
					'functionEnd int',
					'',
					'function convert',
					'#export',
					'param int value',
					'functionEnd int',
					'',
					'function convert',
					'param float value',
					'functionEnd float',
				].join('\n')
			)
		).toThrow('call target "convert" is ambiguous');
	});
});
