import { describe, expect, it } from 'vitest';
import {
	collectProjectIncludeIdsFromBlock,
	collectProjectIncludeIdsFromText,
	resolveFunctionIncludeSource,
	resolveProjectIncludes,
	resolveProjectIncludesAsync,
} from './functionIncludes';

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

describe('include function expansion', () => {
	it('preserves source text and records bindings for each body and its dependencies', () => {
		const functions = resolveFunctionIncludeSource(
			'std/test',
			[
				'function first',
				'#export',
				'call helper',
				'functionEnd int',
				'function helper',
				'param int value',
				'functionEnd int',
			].join('\n')
		);
		expect(functions[0]!.code).toEqual(['function first', '', 'call helper', 'functionEnd int']);
		expect(functions[0]!.bindings.internalName).toBe('__8f4e_std_test__public__first');
		expect(functions[0]!.bindings.callableNames).toEqual(['first']);
		expect(functions[0]!.bindings.callTargets.get('helper')).toBe('__8f4e_std_test__private__helper');
		expect(functions[1]!.code).toEqual(['function helper', 'param int value', 'functionEnd int']);
		expect(functions[1]!.bindings.callableNames).toEqual([]);
	});

	it('uses include-local export aliases as the public binding names', () => {
		const functions = resolveFunctionIncludeSource(
			'std/test',
			['function internalName', '#export publicName', 'functionEnd'].join('\n')
		);
		expect(functions[0]!.bindings.callableNames).toEqual(['publicName']);
		expect(functions[0]!.code).toEqual(['function internalName', '', 'functionEnd']);
	});

	it('allows partially exported overload families when calls are unambiguous', () => {
		const functions = resolveFunctionIncludeSource(
			'std/test',
			[
				'function convert',
				'#export',
				'param int value',
				'functionEnd int',
				'function convert',
				'param float value',
				'functionEnd float',
			].join('\n')
		);
		expect(functions.map(func => func.bindings.callableNames)).toEqual([['convert'], []]);
		expect(new Set(functions.map(func => func.source.symbolName)).size).toBe(2);
	});

	it('rejects sources without exported functions', () => {
		expect(() => resolveFunctionIncludeSource('std/test', 'function helper\nfunctionEnd')).toThrow(
			'include "std/test" must export at least one function'
		);
	});

	it('rejects ambiguous mixed public/private overload calls', () => {
		expect(() =>
			resolveFunctionIncludeSource(
				'std/test',
				[
					'function caller',
					'#export',
					'call convert 1',
					'functionEnd int',
					'function convert',
					'#export',
					'param int value',
					'functionEnd int',
					'function convert',
					'param float value',
					'functionEnd float',
				].join('\n')
			)
		).toThrow('call target "convert" is ambiguous');
	});
});

describe('include export selections', () => {
	it('resolves multiple sources and their include metadata', async () => {
		const functions = await resolveProjectIncludesAsync(
			[includeBlock('include std/first', 'include std/second')],
			includeId => `function ${includeId.split('/')[1]}\n#export\nfunctionEnd`
		);
		expect(functions.map(func => [func.source.includeId, func.bindings.callableNames])).toEqual([
			['std/first', ['first']],
			['std/second', ['second']],
		]);
	});

	it('selects the whole public overload family, keeping unselected exports as internal dependencies', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test first')], () => selectableSource);
		expect(functions.map(func => func.bindings.callableNames)).toEqual([['first'], ['first'], [], [], []]);
		expect(functions[0]!.bindings.callTargets.get('second')).toBe('__8f4e_std_test__public__second');
	});

	it('registers multiple aliases per body and loads each source once', async () => {
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
		expect(functions).toHaveLength(5);
		expect(functions.map(func => func.bindings.callableNames)).toEqual([['a', 'c'], ['a', 'c'], ['b'], [], []]);
		expect(functions[0]!.code).toContain('call helper value');
		expect(functions[0]!.bindings.callTargets.get('second')).toBe('__8f4e_std_test__public__second');
	});

	it('keeps bodies and identities unchanged when selections or aliases change', () => {
		const all = resolveProjectIncludes([includeBlock('include std/test')], () => selectableSource);
		const selected = resolveProjectIncludes([includeBlock('include std/test first renamed')], () => selectableSource);
		expect(selected.map(({ code, source }) => ({ code, source }))).toEqual(
			all.map(({ code, source }) => ({ code, source }))
		);
	});

	it('deduplicates repeated include-all declarations', () => {
		const functions = resolveProjectIncludes(
			[includeBlock('include std/test', 'include std/test')],
			() => selectableSource
		);
		expect(functions).toHaveLength(5);
		expect(functions.map(func => func.bindings.callableNames)).toEqual([['first'], ['first'], ['second'], [], []]);
	});

	it.each([
		['include std/test', 'include std/test first renamed'],
		['include std/test first renamed', 'include std/test'],
	])('combines include-all and aliases without duplicating bodies: %s, %s', (...declarations) => {
		const functions = resolveProjectIncludes([includeBlock(...declarations)], () => selectableSource);
		expect(functions).toHaveLength(5);
		for (const func of functions.slice(0, 2)) {
			expect(func.bindings.callableNames).toHaveLength(2);
			expect(func.bindings.callableNames).toEqual(expect.arrayContaining(['first', 'renamed']));
		}
	});

	it.each(['missing', 'helper', 'originalFirst'])(
		'rejects non-public selections with declaration diagnostics: %s',
		name => {
			expect(() =>
				resolveProjectIncludes([includeBlock(`include std/test ${name}`)], () => selectableSource)
			).toThrowError(
				expect.objectContaining({
					message: `Parse error at line 2: include "std/test" does not export "${name}"`,
					lineNumber: 2,
					projectBlockId: 42,
				})
			);
		}
	);

	it('skips disabled include blocks', async () => {
		const functions = await resolveProjectIncludesAsync(
			[
				{ ...includeBlock('include std/missing helper alias'), disabled: true },
				includeBlock('include std/test second'),
			],
			includeId => (includeId === 'std/test' ? selectableSource : undefined)
		);
		expect(functions.map(func => func.bindings.callableNames)).toEqual([[], [], ['second'], [], []]);
	});

	it('rewrites recursive source-name and export-alias calls to one identity', () => {
		const functions = resolveProjectIncludes([includeBlock('include std/test publicName localName')], () =>
			['function sourceName', '#export publicName', 'call sourceName', 'call publicName', 'functionEnd'].join('\n')
		);
		expect(functions[0]!.bindings.callableNames).toEqual(['localName']);
		expect(functions[0]!.code).toEqual([
			'function sourceName',
			'',
			'call sourceName',
			'call publicName',
			'functionEnd',
		]);
		expect(functions[0]!.bindings.callTargets.get('sourceName')).toBe('__8f4e_std_test__public__publicName');
		expect(functions[0]!.bindings.callTargets.get('publicName')).toBe('__8f4e_std_test__public__publicName');
	});

	it('keeps distinct export aliases under distinct identities when unselected', () => {
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
		expect(functions.map(func => func.bindings.callableNames)).toEqual([[], [], ['selected']]);
		expect(new Set(functions.map(func => func.source.symbolName)).size).toBe(3);
	});

	it('keeps export and helper names separate and preserves source-name call precedence', () => {
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
		expect(new Set(functions.map(func => func.source.symbolName)).size).toBe(3);
		expect(functions[0]!.bindings.callTargets.get('helper')).toBe('__8f4e_std_test__private__helper');
		expect(functions[2]!.bindings.callTargets.get('sourceName')).toBe('__8f4e_std_test__public__helper');
	});

	it('reports unresolved includes with block-relative diagnostics', async () => {
		await expect(
			resolveProjectIncludesAsync([includeBlock('include std/missing')], () => undefined)
		).rejects.toMatchObject({
			lineNumber: 2,
			projectBlockId: 42,
			message: 'Parse error at line 2: unresolved include "std/missing"',
		});
	});

	it('collects source ids from selected and renamed includes', () => {
		expect(
			collectProjectIncludeIdsFromText(
				'8f4e/v1\nincludes\ninclude std/test first a\ninclude std/other second\nincludesEnd'
			)
		).toEqual(['std/test', 'std/other']);
	});

	it.each(['include', 'include std/test first alias extra'])('rejects malformed declarations: %s', line => {
		expect(() => collectProjectIncludeIdsFromBlock(includeBlock(line))).toThrow(
			'include expects <path> [exportedName [localName]]'
		);
	});
});
