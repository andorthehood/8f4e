import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { flattenProjectForCompiler } from './effect';

describe('flattenProjectForCompiler', () => {
	it('should exclude unknown blocks from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
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

		expect(result.entries.main).toHaveLength(1);
		expect(result.entries.main[0].code).toEqual(['module test', 'moduleEnd']);
		expect(result.entries.main[0].projectBlockId).toBe(0);
		expect(result.functions).toHaveLength(1);
		expect(result.functions[0].code).toEqual(['function helper', 'functionEnd']);
		expect(result.functions[0].projectBlockId).toBe(2);
	});

	it('should include project include functions in compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['includes', 'include std/events/risingEdge', 'includesEnd'],
				blockType: 'includes',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const includedFunctionBlocks = [
			{
				code: ['function risingEdge', 'functionEnd int'],
				source: { kind: 'include' as const, includeId: 'std/events/risingEdge', symbolName: 'risingEdge' },
			},
		];

		const result = flattenProjectForCompiler(mockCodeBlocks, includedFunctionBlocks);

		expect(result.entries.main).toEqual([{ code: ['module test', 'moduleEnd'], projectBlockId: 1 }]);
		expect(result.functions).toEqual(includedFunctionBlocks);
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
				entry: 'main',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.entries.main).toHaveLength(1);
		expect(result.entries.main[0].code).toEqual(['module test', 'moduleEnd']);
		expect(result.functions).toHaveLength(0);
	});

	it('should include constants blocks separately but not unknown blocks', () => {
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

		expect(result.entries.main).toHaveLength(0);
		expect(result.constants).toHaveLength(1);
		expect(result.constants?.[0].code).toEqual(['constants', 'constantsEnd']);
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

		expect(result.entries.main).toHaveLength(0);
		expect(result.functions).toHaveLength(0);
	});

	it('should exclude disabled modules from compilation', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['module enabled', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
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

		expect(result.entries.main).toHaveLength(1);
		expect(result.entries.main[0].code).toEqual(['module enabled', 'moduleEnd']);
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

		expect(result.entries.main).toHaveLength(0);
		expect(result.constants).toHaveLength(1);
		expect(result.constants?.[0].code).toEqual(['constants enabled', 'constantsEnd']);
	});

	it('should include prototype blocks separately', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['prototype oscillatorState', 'float phase', 'prototypeEnd'],
				blockType: 'prototype',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['module oscillator', 'shape oscillatorState', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.entries.main[0].code).toEqual(['module oscillator', 'shape oscillatorState', 'moduleEnd']);
		expect(result.prototypes).toEqual([
			{ code: ['prototype oscillatorState', 'float phase', 'prototypeEnd'], projectBlockId: 0 },
		]);
	});

	it('should preserve creationIndex order across mixed compiler block types', () => {
		const mockCodeBlocks: CodeBlockGraphicData[] = [
			{
				code: ['prototype third', 'int value', 'prototypeEnd'],
				blockType: 'prototype',
				creationIndex: 2,
			} as CodeBlockGraphicData,
			{
				code: ['module first', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				creationIndex: 0,
			} as CodeBlockGraphicData,
			{
				code: ['function second', 'functionEnd'],
				blockType: 'function',
				creationIndex: 1,
			} as CodeBlockGraphicData,
		];

		const result = flattenProjectForCompiler(mockCodeBlocks);

		expect(result.entries.main[0].code).toEqual(['module first', 'moduleEnd']);
		expect(result.functions[0].code).toEqual(['function second', 'functionEnd']);
		expect(result.prototypes[0].code).toEqual(['prototype third', 'int value', 'prototypeEnd']);
	});
});
