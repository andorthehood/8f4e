import { describe, it, expect } from 'vitest';

import { flattenProjectForCompiler } from './effect';

import type { CodeBlockGraphicData } from '../../types';

describe('flattenProjectForCompiler', () => {
	it('should exclude comment blocks from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['comment', 'This is a comment', 'commentEnd'],
				blockType: 'comment',
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				code: ['function helper', 'functionEnd'],
				blockType: 'function',
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				code: ['comment', 'Another comment', 'commentEnd'],
				blockType: 'comment',
				creationIndex: 3,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['module test', 'moduleEnd']);
		expect(result.functions).toHaveLength(1);
		expect(result.functions[0].code).toEqual(['function helper', 'functionEnd']);
	});

	it('should include constants blocks but not comment blocks', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['constants', 'constantsEnd'],
				blockType: 'constants',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['comment', 'Documentation', 'commentEnd'],
				blockType: 'comment',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['constants', 'constantsEnd']);
		expect(result.functions).toHaveLength(0);
	});

	it('should handle only comment blocks', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['comment', 'Comment 1', 'commentEnd'],
				blockType: 'comment',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['comment', 'Comment 2', 'commentEnd'],
				blockType: 'comment',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(0);
		expect(result.functions).toHaveLength(0);
	});
});
