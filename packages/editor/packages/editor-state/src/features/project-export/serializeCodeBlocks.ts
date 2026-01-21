import { extractConfigType } from '../config-compiler/extractConfigBody';

import type { CodeBlock, CodeBlockGraphicData } from '~/types';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

/**
 * Checks if a code block is an editor config block (config editor).
 */
function isEditorConfigBlock(block: CodeBlockGraphicData): boolean {
	if (block.blockType !== 'config') {
		return false;
	}
	const configType = extractConfigType(block.code);
	return configType === 'editor';
}

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Uses gridX/gridY from code blocks for persistent storage.
 * Excludes editor config blocks (config editor) as they are session-specific.
 * @param codeBlocks Array of code blocks with full graphic data
 * @returns Array of simplified code blocks suitable for file format with gridCoordinates
 */
export default function convertGraphicDataToProjectStructure(codeBlocks: CodeBlockGraphicData[]): CodeBlock[] {
	const codeBlocksCopy = [...codeBlocks];

	return codeBlocksCopy
		.filter(block => !isEditorConfigBlock(block)) // Exclude editor config blocks
		.sort((codeBlockA, codeBlockB) => {
			if (codeBlockA.id > codeBlockB.id) {
				return 1;
			} else if (codeBlockA.id < codeBlockB.id) {
				return -1;
			}
			return 0;
		})
		.map(codeBlock => ({
			code: codeBlock.code,
			gridCoordinates: {
				x: codeBlock.gridX,
				y: codeBlock.gridY,
			},
			...(codeBlock.disabled && { disabled: codeBlock.disabled }),
		}));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('convertGraphicDataToProjectStructure', () => {
		it('sorts code blocks by id before mapping', () => {
			const blocks: CodeBlockGraphicData[] = [
				createMockCodeBlock({ id: 'b', code: ['line 1'], gridX: 1, gridY: 2 }),
				createMockCodeBlock({ id: 'a', code: ['line 2'], gridX: 3, gridY: 4 }),
			];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result.map(block => block.code[0])).toEqual(['line 2', 'line 1']);
		});

		it('uses gridX and gridY directly for gridCoordinates', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: '1', code: ['code'], gridX: 5, gridY: 7 })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0].gridCoordinates).toEqual({ x: 5, y: 7 });
		});

		it('includes disabled field when block is disabled', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'disabled', code: ['code'], disabled: true })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0].disabled).toBe(true);
		});

		it('omits disabled field when block is not disabled', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'enabled', code: ['code'], disabled: false })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0].disabled).toBeUndefined();
		});

		it('excludes editor config blocks from serialization', () => {
			const blocks: CodeBlockGraphicData[] = [
				createMockCodeBlock({ id: 'project', code: ['config project', 'configEnd'], blockType: 'config' }),
				createMockCodeBlock({ id: 'editor', code: ['config editor', 'configEnd'], blockType: 'config' }),
				createMockCodeBlock({ id: 'module', code: ['module test', 'moduleEnd'], blockType: 'module' }),
			];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result).toHaveLength(2);
			expect(result.some(block => block.code.includes('config editor'))).toBe(false);
			expect(result.some(block => block.code.includes('config project'))).toBe(true);
			expect(result.some(block => block.code.includes('module test'))).toBe(true);
		});

		it('includes project config blocks but not editor config blocks', () => {
			const blocks: CodeBlockGraphicData[] = [
				createMockCodeBlock({
					id: 'editor-config',
					code: ['config editor', 'set colorScheme dark', 'configEnd'],
					blockType: 'config',
				}),
				createMockCodeBlock({
					id: 'project-config',
					code: ['config project', 'push 1024', 'configEnd'],
					blockType: 'config',
				}),
			];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result).toHaveLength(1);
			expect(result[0].code).toEqual(['config project', 'push 1024', 'configEnd']);
		});
	});
}
