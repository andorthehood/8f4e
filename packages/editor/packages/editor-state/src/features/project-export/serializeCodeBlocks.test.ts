import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

describe('convertGraphicDataToProjectStructure', () => {
	it('places editor blocks in their canonical collections', () => {
		const result = convertGraphicDataToProjectStructure([
			createMockCodeBlock({
				code: ['module second', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 2,
				entry: 'main',
				gridX: 10,
				gridY: 0,
			}),
			createMockCodeBlock({
				code: ['function first', 'functionEnd'],
				blockType: 'function',
				creationIndex: 1,
				gridX: 0,
				gridY: 0,
			}),
		]);

		expect(result.functions).toEqual([{ id: 1, code: ['function first', 'functionEnd'] }]);
		expect(result.modules).toEqual([{ id: 2, code: ['module second', 'moduleEnd'], entry: 'main' }]);
	});

	it('sorts code blocks by grid position before mapping', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({ name: 'a', code: ['line 1'], gridX: 20, gridY: 0 }),
			createMockCodeBlock({ name: 'b', code: ['line 2'], gridX: 0, gridY: 10 }),
			createMockCodeBlock({ name: 'c', code: ['line 3'], gridX: 0, gridY: 0 }),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.unknown.map(block => block.code[0])).toEqual(['line 3', 'line 2', 'line 1']);
	});

	it('exports code without gridCoordinates field', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ name: '1', code: ['code'], gridX: 5, gridY: 7 })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.unknown[0]).not.toHaveProperty('gridCoordinates');
		expect(result.unknown[0]).not.toHaveProperty('disabled');
		expect(result.unknown[0].code).toEqual(['code']);
	});

	it('stores explicit disabled state when a block is disabled', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ name: 'disabled', code: ['code'], disabled: true })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.unknown[0].disabled).toBe(true);
		expect(result.unknown[0].code).toEqual(['code']);
	});

	it('does not include disabled field when block is not disabled', () => {
		const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ name: 'enabled', code: ['code'], disabled: false })];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.unknown[0]).not.toHaveProperty('disabled');
		expect(result.unknown[0].code).toEqual(['code']);
	});

	it('excludes browser-local notes from the exported project', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				name: 'local',
				creationIndex: 0,
				blockType: 'note',
				code: ['note local.editorConfig', '; @config font ibmvga8x16', 'noteEnd'],
			}),
			createMockCodeBlock({
				name: 'project-note',
				creationIndex: 1,
				blockType: 'note',
				code: ['note', 'project note', 'noteEnd'],
			}),
			createMockCodeBlock({
				name: 'shader-note',
				creationIndex: 2,
				blockType: 'note',
				code: ['note fragmentShaderPostprocess', 'void main() {}', 'noteEnd'],
			}),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.notes.map(block => block.code[0])).toEqual(['note', 'note fragmentShaderPostprocess']);
	});

	it('stores module entries on module blocks', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				name: 'main',
				creationIndex: 1,
				blockType: 'module',
				entry: 'main',
				code: ['module main', 'moduleEnd'],
			}),
			createMockCodeBlock({
				name: 'entry',
				creationIndex: 2,
				blockType: 'module',
				entry: 'entry1',
				code: ['module entry', 'moduleEnd'],
			}),
		];

		const result = convertGraphicDataToProjectStructure(blocks);

		expect(result.modules).toEqual([
			{ id: 1, code: ['module main', 'moduleEnd'], entry: 'main' },
			{ id: 2, code: ['module entry', 'moduleEnd'], entry: 'entry1' },
		]);
	});

	it('reconstructs recursively owned projects from runtime sub-program paths', () => {
		const result = convertGraphicDataToProjectStructure([
			createMockCodeBlock({
				creationIndex: 1,
				blockType: 'module',
				entry: 'main',
				code: ['module voice', 'moduleEnd'],
				subProgramPath: [
					{ id: 'audio', name: 'Audio', entry: 'main' },
					{ id: 'oscillator', name: 'Oscillator', entry: 'main' },
				],
			}),
		]);

		expect(result.groups[0]).toMatchObject({
			id: 'audio',
			name: 'Audio',
			entry: 'main',
			groups: [
				{
					id: 'oscillator',
					name: 'Oscillator',
					entry: 'main',
					modules: [{ id: 1, entry: 'main', code: ['module voice', 'moduleEnd'] }],
				},
			],
		});
	});

	it('preserves empty nested projects from the loaded project structure', () => {
		const projectStructure = {
			modules: [],
			functions: [],
			constants: [],
			prototypes: [],
			includes: [],
			notes: [],
			unknown: [],
			groups: [
				{
					id: 'empty',
					name: 'Empty',
					entry: 'main',
					modules: [],
					functions: [],
					constants: [],
					prototypes: [],
					includes: [],
					notes: [],
					unknown: [],
					groups: [],
				},
			],
		};

		expect(convertGraphicDataToProjectStructure([], projectStructure).groups).toEqual(projectStructure.groups);
	});

	it('rejects module blocks without an entry', () => {
		const blocks: CodeBlockGraphicData[] = [
			createMockCodeBlock({
				name: 'main',
				blockType: 'module',
				code: ['module main', 'moduleEnd'],
			}),
		];

		expect(() => convertGraphicDataToProjectStructure(blocks)).toThrow('missing an entry');
	});
});
