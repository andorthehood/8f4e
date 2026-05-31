import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

describe('convertGraphicDataToProjectStructure', () => {
	it('sorts code blocks by grid position before mapping', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({ id: 'a', code: ['line 1'], gridX: 20, gridY: 0 }),
			createMockCodeBlock({ id: 'b', code: ['line 2'], gridX: 0, gridY: 10 }),
			createMockCodeBlock({ id: 'c', code: ['line 3'], gridX: 0, gridY: 0 }),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks.map(block => block.code[0])).toEqual(['line 3', 'line 2', 'line 1']);
	});

	it('exports code without gridCoordinates field', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: '1', code: ['code'], gridX: 5, gridY: 7 })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks[0]).not.toHaveProperty('gridCoordinates');
		expect(result.codeBlocks[0]).not.toHaveProperty('disabled');
		expect(result.codeBlocks[0].code).toEqual(['code']);
	});

	it('does not include disabled field even when block is disabled', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'disabled', code: ['code'], disabled: true })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks[0]).not.toHaveProperty('disabled');
		expect(result.codeBlocks[0].code).toEqual(['code']);
	});

	it('does not include disabled field when block is not disabled', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'enabled', code: ['code'], disabled: false })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks[0]).not.toHaveProperty('disabled');
		expect(result.codeBlocks[0].code).toEqual(['code']);
	});

	it('excludes browser-local notes from the exported project', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				id: 'local',
				creationIndex: 0,
				blockType: 'note',
				code: ['note local.editorConfig', '; @config font ibmvga8x16', 'noteEnd'],
			}),
			createMockCodeBlock({
				id: 'project-note',
				creationIndex: 1,
				blockType: 'note',
				code: ['note', 'project note', 'noteEnd'],
			}),
			createMockCodeBlock({
				id: 'shader-note',
				creationIndex: 2,
				blockType: 'note',
				code: ['note fragmentShaderPostprocess', 'void main() {}', 'noteEnd'],
			}),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks.map(block => block.code[0])).toEqual(['note', 'note fragmentShaderPostprocess']);
	});

	it('stores module entries on module blocks', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				id: 'main',
				blockType: 'module',
				entry: 'main',
				code: ['module main', 'moduleEnd'],
			}),
			createMockCodeBlock({
				id: 'entry',
				blockType: 'module',
				entry: 'entry1',
				code: ['module entry', 'moduleEnd'],
			}),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.codeBlocks).toEqual([
			{ code: ['module main', 'moduleEnd'], entry: 'main' },
			{ code: ['module entry', 'moduleEnd'], entry: 'entry1' },
		]);
	});

	it('rejects module blocks without an entry', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				id: 'main',
				blockType: 'module',
				code: ['module main', 'moduleEnd'],
			}),
		];

		expect(() => convertGraphicDataToProjectStructure(blocks)).toThrow('missing an entry');
	});
});
