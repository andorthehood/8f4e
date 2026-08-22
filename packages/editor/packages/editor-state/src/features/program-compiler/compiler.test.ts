import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { toProjectObjectModelForCompiler } from './effect';

describe('toProjectObjectModelForCompiler', () => {
	it('places editor blocks in their canonical collections', () => {
		const result = toProjectObjectModelForCompiler([
			{
				code: ['module second', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 2,
				entry: 'main',
				gridX: 10,
				gridY: 0,
			} as CodeBlockGraphicData,
			{
				code: ['function first', 'functionEnd'],
				blockType: 'function',
				creationIndex: 1,
				gridX: 0,
				gridY: 0,
			} as CodeBlockGraphicData,
		]);

		expect(result.functions).toEqual([{ id: 1, code: ['function first', 'functionEnd'] }]);
		expect(result.modules).toEqual([{ id: 2, code: ['module second', 'moduleEnd'], entry: 'main' }]);
	});

	it('preserves disabled state for the shared preparer', () => {
		expect(
			toProjectObjectModelForCompiler([
				{
					code: ['module disabled', 'moduleEnd'],
					blockType: 'module',
					creationIndex: 0,
					entry: 'main',
					disabled: true,
					gridX: 0,
					gridY: 0,
				} as CodeBlockGraphicData,
			])
		).toMatchObject({
			modules: [
				{
					id: 0,
					code: ['module disabled', 'moduleEnd'],
					disabled: true,
					entry: 'main',
				},
			],
		});
	});
});
