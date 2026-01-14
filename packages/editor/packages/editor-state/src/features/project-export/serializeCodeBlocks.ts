import { createMockCodeBlock } from '../../pureHelpers/testingUtils/testUtils';

import type { CodeBlock, CodeBlockGraphicData } from '../../types';

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Uses gridX/gridY from code blocks for persistent storage.
 * @param codeBlocks Array of code blocks with full graphic data
 * @returns Array of simplified code blocks suitable for file format with gridCoordinates
 */
export default function convertGraphicDataToProjectStructure(codeBlocks: CodeBlockGraphicData[]): CodeBlock[] {
	const codeBlocksCopy = [...codeBlocks];

	return codeBlocksCopy
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
	});
}
