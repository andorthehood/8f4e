import { createMockCodeBlock } from '../testingUtils/testUtils';

import type { CodeBlock, CodeBlockGraphicData } from '../../types';

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Uses gridCoordinates for persistent storage, computed from pixel positions.
 * @param codeBlocks Array of code blocks with full graphic data
 * @param vGrid Vertical grid size for converting pixels to grid coordinates
 * @param hGrid Horizontal grid size for converting pixels to grid coordinates
 * @returns Array of simplified code blocks suitable for file format with gridCoordinates
 */
export default function convertGraphicDataToProjectStructure(
	codeBlocks: CodeBlockGraphicData[],
	vGrid: number,
	hGrid: number
): CodeBlock[] {
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
				x: Math.round(codeBlock.x / vGrid),
				y: Math.round(codeBlock.y / hGrid),
			},
		}));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('convertGraphicDataToProjectStructure', () => {
		it('sorts code blocks by id before mapping', () => {
			const blocks: CodeBlockGraphicData[] = [
				createMockCodeBlock({ id: 'b', code: ['line 1'], x: 10, y: 20 }),
				createMockCodeBlock({ id: 'a', code: ['line 2'], x: 30, y: 40 }),
			];

			const result = convertGraphicDataToProjectStructure(blocks, 10, 10);

			expect(result.map(block => block.code[0])).toEqual(['line 2', 'line 1']);
		});

		it('converts pixel coordinates to rounded grid coordinates', () => {
			const blocks: CodeBlockGraphicData[] = [createMockCodeBlock({ id: '1', code: ['code'], x: 15, y: 24 })];

			const result = convertGraphicDataToProjectStructure(blocks, 10, 10);

			expect(result[0].gridCoordinates).toEqual({ x: 2, y: 2 });
		});
	});
}
