import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { toOrderedProjectBlocksForCompiler } from './effect';

describe('toOrderedProjectBlocksForCompiler', () => {
	it('maps editor code blocks to plain project blocks in grid order', () => {
		const result = toOrderedProjectBlocksForCompiler([
			{
				code: ['module second', 'moduleEnd'],
				creationIndex: 2,
				entry: 'main',
				gridX: 10,
				gridY: 0,
			} as CodeBlockGraphicData,
			{
				code: ['function first', 'functionEnd'],
				creationIndex: 1,
				gridX: 0,
				gridY: 0,
			} as CodeBlockGraphicData,
		]);

		expect(result).toEqual([
			{
				id: 1,
				code: ['function first', 'functionEnd'],
				disabled: undefined,
				entry: undefined,
			},
			{
				id: 2,
				code: ['module second', 'moduleEnd'],
				disabled: undefined,
				entry: 'main',
			},
		]);
	});

	it('preserves disabled state for the shared preparer', () => {
		expect(
			toOrderedProjectBlocksForCompiler([
				{
					code: ['module disabled', 'moduleEnd'],
					creationIndex: 0,
					entry: 'main',
					disabled: true,
					gridX: 0,
					gridY: 0,
				} as CodeBlockGraphicData,
			])
		).toEqual([
			{
				id: 0,
				code: ['module disabled', 'moduleEnd'],
				disabled: true,
				entry: 'main',
			},
		]);
	});
});
