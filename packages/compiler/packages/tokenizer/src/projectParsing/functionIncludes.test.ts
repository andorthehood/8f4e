import { describe, expect, it } from 'vitest';

import {
	type ProjectIncludeError,
	resolveFunctionIncludeSource,
	resolveProjectIncludesAsync,
} from './functionIncludes';

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
						return ['function risingEdge', 'functionEnd int'].join('\n');
					}
					if (includeId === 'std/memory/wrapPointer') {
						return ['function wrapPointer', 'functionEnd int*'].join('\n');
					}
					return undefined;
				}
			)
		).resolves.toEqual([
			{
				code: ['function risingEdge', 'functionEnd int'],
				source: { kind: 'include', includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
			{
				code: ['function wrapPointer', 'functionEnd int*'],
				source: { kind: 'include', includeId: 'std/memory/wrapPointer', symbolName: 'wrapPointer' },
			},
		]);
	});

	it('throws structured include errors with project line numbers', async () => {
		await expect(
			resolveProjectIncludesAsync(
				[{ id: 10, code: ['includes', 'include std/missing', 'includesEnd'] }],
				() => undefined
			)
		).rejects.toMatchObject({
			name: 'ProjectIncludeError',
			lineNumber: 11,
			message: 'Parse error at line 11: unresolved include "std/missing"',
		} satisfies Partial<ProjectIncludeError>);
	});
});
