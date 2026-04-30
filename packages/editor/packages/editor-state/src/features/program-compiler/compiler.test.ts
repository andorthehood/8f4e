import { describe, it, expect } from 'vitest';

import { flattenProjectForCompiler } from './effect';

import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';

describe('flattenProjectForCompiler', () => {
	it('should exclude unknown blocks from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['unknown marker'],
				blockType: 'unknown',
				creationIndex: 1,
			} as CodeBlockGraphicData,
			{
				code: ['function helper', 'functionEnd'],
				blockType: 'function',
				creationIndex: 2,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['module test', 'moduleEnd']);
		expect(result.functions).toHaveLength(1);
		expect(result.functions[0].code).toEqual(['function helper', 'functionEnd']);
	});

	it('should exclude note blocks from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['note', '; @pos 10 10', 'todo: clean this up', 'noteEnd'],
				blockType: 'note',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['module test', 'moduleEnd']);
		expect(result.functions).toHaveLength(0);
		expect(result.macros).toHaveLength(0);
	});

	it('should include constants blocks but not unknown blocks', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['constants', 'constantsEnd'],
				blockType: 'constants',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['???'],
				blockType: 'unknown',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['constants', 'constantsEnd']);
		expect(result.functions).toHaveLength(0);
	});

	it('should handle only unknown blocks', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['unknown 1'],
				blockType: 'unknown',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['unknown 2'],
				blockType: 'unknown',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(0);
		expect(result.functions).toHaveLength(0);
	});

	it('should exclude disabled modules from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['module enabled', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
				disabled: false,
			} as CodeBlockGraphicData,
			{
				code: ['module disabled', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 1,
				disabled: true,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['module enabled', 'moduleEnd']);
	});

	it('should exclude disabled functions from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['function enabled', 'functionEnd'],
				blockType: 'function',
				creationIndex: 0,
				disabled: false,
			} as CodeBlockGraphicData,
			{
				code: ['function disabled', 'functionEnd'],
				blockType: 'function',
				creationIndex: 1,
				disabled: true,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.functions).toHaveLength(1);
		expect(result.functions[0].code).toEqual(['function enabled', 'functionEnd']);
	});

	it('should exclude disabled constants from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['constants enabled', 'constantsEnd'],
				blockType: 'constants',
				creationIndex: 0,
				disabled: false,
			} as CodeBlockGraphicData,
			{
				code: ['constants disabled', 'constantsEnd'],
				blockType: 'constants',
				creationIndex: 1,
				disabled: true,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules).toHaveLength(1);
		expect(result.modules[0].code).toEqual(['constants enabled', 'constantsEnd']);
	});

	it('should preserve creationIndex order across mixed block types', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['macro third', 'macroEnd'],
				blockType: 'macro',
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				code: ['module first', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['function second', 'functionEnd'],
				blockType: 'function',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.modules[0].code).toEqual(['module first', 'moduleEnd']);
		expect(result.functions[0].code).toEqual(['function second', 'functionEnd']);
		expect(result.macros[0].code).toEqual(['macro third', 'macroEnd']);
	});
});
