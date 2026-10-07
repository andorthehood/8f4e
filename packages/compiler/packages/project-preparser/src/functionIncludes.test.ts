import { describe, expect, it } from 'vitest';

import {
	collectProjectIncludeIdsFromBlock,
	collectProjectIncludeIdsFromText,
	type ProjectIncludeError,
	resolveFunctionIncludeSource,
	resolveProjectIncludes,
	resolveProjectIncludesAsync,
} from './functionIncludes';

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

describe('resolveProjectIncludesAsync', () => {
	it('resolves include lines from project includes blocks into function blocks', async () => {
		await expect(
			resolveProjectIncludesAsync(
				[
					{
						id: 10,
						code: [
							'includes',
							'; @pos 0 0',
							'include std/events/risingEdge',
							'include std/memory/wrapPointer',
							'includesEnd',
						],
					},
				],
				async includeId => {
					if (includeId === 'std/events/risingEdge') {
						return ['function risingEdge', '#export', 'functionEnd int'].join('\n');
					}
					if (includeId === 'std/memory/wrapPointer') {
						return ['function wrapPointer', '#export', 'functionEnd int*'].join('\n');
					}
					return undefined;
				}
			)
		).resolves.toEqual([
			{
				code: ['function risingEdge', '', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
			{
				code: ['function wrapPointer', '', 'functionEnd int*'],
				source: { kind: 'include', includeId: 'std/memory/wrapPointer', symbolName: 'wrapPointer' },
			},
		]);
	});

	it('dedupes repeated include declarations by include id', async () => {
		await expect(
			resolveProjectIncludesAsync(
				[
					{
						id: 10,
						code: ['includes', 'include std/events/risingEdge', 'include std/events/risingEdge', 'includesEnd'],
					},
				],
				async includeId =>
					includeId === 'std/events/risingEdge'
						? ['function risingEdge', '#export', 'functionEnd int'].join('\n')
						: undefined
			)
		).resolves.toEqual([
			{
				code: ['function risingEdge', '', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
		]);
	});

	it('throws structured include errors with block-relative line numbers', async () => {
		await expect(
			resolveProjectIncludesAsync(
				[{ id: 10, code: ['includes', 'include std/missing', 'includesEnd'] }],
				() => undefined
			)
		).rejects.toMatchObject({
			name: 'ProjectIncludeError',
			lineNumber: 2,
			message: 'Parse error at line 2: unresolved include "std/missing"',
		} satisfies Partial<ProjectIncludeError>);
	});
});

const selectableSource = [
	'function originalFirst',
	'#export first',
	'param int value',
	'call helper value',
	'call second',
	'functionEnd int',
	'function originalFirst',
	'#export first',
	'param float value',
	'call helper value',
	'functionEnd float',
	'function second',
	'#export',
	'param int value',
	'call helper value',
	'functionEnd int',
	'function helper',
	'param int value',
	'push value',
	'functionEnd int',
	'function helper',
	'param float value',
	'push value',
	'functionEnd float',
].join('\n');

function includeBlock(...declarations: string[]) {
	return { id: 42, code: ['includes', ...declarations, 'includesEnd'] };
}

describe('include export selections', () => {
	it('selects exported names, keeps their overloads, and makes other exports private dependencies', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test first')], () => selectableSource);
		expect(functions.map(func => func.source.symbolName)).toEqual([
			'first',
			'first',
			'__8f4e_std_test__second',
			'__8f4e_std_test__helper',
			'__8f4e_std_test__helper',
		]);
		expect(functions[0]!.code).toContain('call __8f4e_std_test__second');
	});

	it('renames selected families and shares helpers across multiple selections and aliases', async () => {
		const loaded: string[] = [];
		const functions = await resolveProjectIncludesAsync(
			[
				includeBlock(
					'include std/test first a',
					'include std/test second b',
					'include std/test first c',
					'include std/test first a'
				),
			],
			async includeId => {
				loaded.push(includeId);
				return selectableSource;
			}
		);
		expect(loaded).toEqual(['std/test']);
		expect(functions.map(func => func.source.symbolName)).toEqual([
			'a',
			'c',
			'a',
			'c',
			'b',
			'__8f4e_std_test__helper',
			'__8f4e_std_test__helper',
		]);
		for (const func of functions.filter(func => ['a', 'c'].includes(func.source.symbolName))) {
			expect(func.code).toContain('call __8f4e_std_test__helper value');
			expect(func.code).not.toContain('#export first');
		}
		expect(functions[0]!.code).toContain('call b');
	});

	it.each([
		['include std/test', 'include std/test first renamed'],
		['include std/test first renamed', 'include std/test'],
	])('combines include-all with an alias in either order: %s, %s', (...declarations) => {
		let loads = 0;
		const functions = resolveProjectIncludes([includeBlock(...declarations)], () => {
			loads += 1;
			return selectableSource;
		});
		expect(loads).toBe(1);
		expect(functions.filter(func => func.source.symbolName === 'first')).toHaveLength(2);
		expect(functions.filter(func => func.source.symbolName === 'renamed')).toHaveLength(2);
		expect(functions.filter(func => func.source.symbolName === 'second')).toHaveLength(1);
		expect(functions.filter(func => func.source.symbolName === '__8f4e_std_test__helper')).toHaveLength(2);
	});

	it.each(['missing', 'helper', 'originalFirst'])('rejects selections that are not public exports: %s', name => {
		expect(() => resolveProjectIncludes([includeBlock(`include std/test ${name}`)], () => selectableSource)).toThrow(
			`include "std/test" does not export "${name}"`
		);
		try {
			resolveProjectIncludes([includeBlock(`include std/test ${name}`)], () => selectableSource);
		} catch (error) {
			expect(error).toMatchObject({ lineNumber: 2, projectBlockId: 42 });
		}
	});

	it('skips disabled selections', async () => {
		const functions = await resolveProjectIncludesAsync(
			[
				{ ...includeBlock('include std/missing helper alias'), disabled: true },
				includeBlock('include std/test second'),
			],
			includeId => (includeId === 'std/test' ? selectableSource : undefined)
		);
		expect(functions.filter(func => func.source.symbolName === 'second')).toHaveLength(1);
	});

	it('rewrites recursive calls made through source names and export aliases', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test publicName localName')], () =>
			['function sourceName', '#export publicName', 'call sourceName', 'call publicName', 'functionEnd'].join('\n')
		);
		expect(functions[0]!.code).toEqual(['function localName', '', 'call localName', 'call localName', 'functionEnd']);
	});

	it('keeps distinct export aliases private under distinct names when unselected', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test selected')], () =>
			[
				'function sameSourceName',
				'#export first',
				'functionEnd',
				'function sameSourceName',
				'#export second',
				'functionEnd',
				'function selected',
				'#export',
				'functionEnd',
			].join('\n')
		);
		expect(functions.map(func => func.source.symbolName)).toEqual([
			'__8f4e_std_test__first',
			'__8f4e_std_test__second',
			'selected',
		]);
	});

	it('preserves calls to source declarations that share an export alias', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test publicName renamed')], () =>
			[
				'function sourceName',
				'#export publicName',
				'call publicName',
				'functionEnd',
				'function publicName',
				'functionEnd',
			].join('\n')
		);
		expect(functions[0]!.code).toContain('call __8f4e_std_test__publicName');
	});

	it('avoids collisions between private helpers and unselected export aliases', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test selected')], () =>
			[
				'function sourceName',
				'#export helper',
				'call helper',
				'functionEnd',
				'function helper',
				'functionEnd',
				'function selected',
				'#export',
				'call sourceName',
				'functionEnd',
			].join('\n')
		);
		expect(functions.map(func => func.source.symbolName)).toEqual([
			'__8f4e_std_test__helper_1',
			'__8f4e_std_test__helper',
			'selected',
		]);
		expect(functions[0]!.code).toContain('call __8f4e_std_test__helper');
		expect(functions[2]!.code).toContain('call __8f4e_std_test__helper_1');
	});

	it('collects source ids from selected and renamed includes', () => {
		expect(
			collectProjectIncludeIdsFromText(
				['8f4e/v1', 'includes', 'include std/test first a', 'include std/other second', 'includesEnd'].join('\n')
			)
		).toEqual(['std/test', 'std/other']);
	});

	it.each(['include', 'include std/test first alias extra'])(
		'rejects malformed declarations with block-relative diagnostics: %s',
		line => {
			expect(() => collectProjectIncludeIdsFromBlock(includeBlock(line))).toThrow(
				'include expects <path> [exportedName [localName]]'
			);
		}
	);
});
