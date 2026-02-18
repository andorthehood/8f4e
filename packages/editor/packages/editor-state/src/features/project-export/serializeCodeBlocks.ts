import { isConfigBlockOfType } from '../config-compiler/utils/isConfigBlockOfType';

import type { CodeBlock, CodeBlockGraphicData } from '~/types';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Position is stored in @pos directive within code, not in separate gridCoordinates field.
 * Disabled state is stored in @disabled directive within code, not in separate disabled field.
 * Excludes editor config blocks from the exported project.
 * @param codeBlocks Array of code blocks with full graphic data
 * @returns Array of simplified code blocks suitable for file format
 */
export default function convertGraphicDataToProjectStructure(codeBlocks: CodeBlockGraphicData[]): CodeBlock[] {
	const codeBlocksCopy = [...codeBlocks];

	return codeBlocksCopy
		.filter(codeBlock => {
			// Exclude editor config blocks from project export
			if (isConfigBlockOfType(codeBlock, 'editor')) {
				return false;
			}
			return true;
		})
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

		it('exports code without gridCoordinates field', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: '1', code: ['code'], gridX: 5, gridY: 7 })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0]).not.toHaveProperty('gridCoordinates');
			expect(result[0]).not.toHaveProperty('disabled');
			expect(result[0].code).toEqual(['code']);
		});

		it('does not include disabled field even when block is disabled', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'disabled', code: ['code'], disabled: true })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0]).not.toHaveProperty('disabled');
			expect(result[0].code).toEqual(['code']);
		});

		it('does not include disabled field when block is not disabled', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: 'enabled', code: ['code'], disabled: false })];

			const result = convertGraphicDataToProjectStructure(blocks);

			expect(result[0]).not.toHaveProperty('disabled');
			expect(result[0].code).toEqual(['code']);
		});
	});
}
