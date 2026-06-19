import { describe, expect, it } from 'vitest';

import {
	IncludeResolutionError,
	parseIncludeDeclarations,
	resolveIncludeSourceTree,
	resolveIncludeSourceTreeAsync,
} from './index';

describe('parseIncludeDeclarations', () => {
	it('collects include declarations from a single includes block', () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'; @pos 0 0',
			'include std/events/risingEdge',
			'include std/memory/wrapPointer',
			'includesEnd',
			'',
			'entry main',
			'entryEnd',
		].join('\n');

		expect(parseIncludeDeclarations(source)).toEqual({
			source,
			includes: [
				{ includeId: 'std/events/risingEdge', lineNumber: 5 },
				{ includeId: 'std/memory/wrapPointer', lineNumber: 6 },
			],
		});
	});

	it('allows sources without an includes block', () => {
		const source = ['8f4e/v1', '', 'entry main', 'entryEnd'].join('\n');

		expect(parseIncludeDeclarations(source)).toEqual({ source, includes: [] });
	});

	it('rejects multiple includes blocks', () => {
		expect(() =>
			parseIncludeDeclarations(
				['8f4e/v1', 'includes', 'include std/a', 'includesEnd', 'includes', 'include std/b', 'includesEnd'].join('\n')
			)
		).toThrow('project can contain at most one includes block');
	});

	it('rejects malformed include declarations inside the includes block', () => {
		expect(() =>
			parseIncludeDeclarations(['8f4e/v1', 'includes', 'include std/a std/b', 'includesEnd'].join('\n'))
		).toThrow('include requires exactly one include id');
	});

	it('rejects unclosed include blocks', () => {
		expect(() => parseIncludeDeclarations(['8f4e/v1', 'includes', 'include std/a'].join('\n'))).toThrow(
			'unclosed block with opener "includes"'
		);
	});
});

describe('resolveIncludeSourceTree', () => {
	it('resolves direct includes into a shallow raw source tree', () => {
		const source = ['8f4e/v1', 'includes', 'include std/a', 'include std/b', 'includesEnd'].join('\n');

		expect(
			resolveIncludeSourceTree(
				source,
				includeId => ({ 'std/a': 'function a\nfunctionEnd', 'std/b': 'function b\nfunctionEnd' })[includeId]
			)
		).toEqual({
			source,
			children: [
				{ includeId: 'std/a', source: 'function a\nfunctionEnd', children: [] },
				{ includeId: 'std/b', source: 'function b\nfunctionEnd', children: [] },
			],
		});
	});

	it('dedupes repeated direct include declarations', () => {
		const source = ['8f4e/v1', 'includes', 'include std/a', 'include std/a', 'includesEnd'].join('\n');

		expect(resolveIncludeSourceTree(source, () => 'function a\nfunctionEnd').children).toEqual([
			{ includeId: 'std/a', source: 'function a\nfunctionEnd', children: [] },
		]);
	});

	it('does not resolve nested includes yet', () => {
		const source = ['8f4e/v1', 'includes', 'include std/a', 'includesEnd'].join('\n');
		const childSource = ['includes', 'include std/b', 'includesEnd', 'function a', 'functionEnd'].join('\n');

		expect(resolveIncludeSourceTree(source, () => childSource)).toEqual({
			source,
			children: [{ includeId: 'std/a', source: childSource, children: [] }],
		});
	});

	it('throws structured unresolved include diagnostics', () => {
		expect(() =>
			resolveIncludeSourceTree(
				['8f4e/v1', 'includes', 'include std/missing', 'includesEnd'].join('\n'),
				() => undefined
			)
		).toThrow(IncludeResolutionError);
		expect(() =>
			resolveIncludeSourceTree(
				['8f4e/v1', 'includes', 'include std/missing', 'includesEnd'].join('\n'),
				() => undefined
			)
		).toThrow('Parse error at line 3: unresolved include "std/missing"');
	});
});

describe('resolveIncludeSourceTreeAsync', () => {
	it('resolves each unique include id once', async () => {
		const source = ['8f4e/v1', 'includes', 'include std/a', 'include std/a', 'includesEnd'].join('\n');
		const resolvedIds: string[] = [];

		await expect(
			resolveIncludeSourceTreeAsync(source, async includeId => {
				resolvedIds.push(includeId);
				return 'function a\nfunctionEnd';
			})
		).resolves.toEqual({
			source,
			children: [{ includeId: 'std/a', source: 'function a\nfunctionEnd', children: [] }],
		});
		expect(resolvedIds).toEqual(['std/a']);
	});
});
