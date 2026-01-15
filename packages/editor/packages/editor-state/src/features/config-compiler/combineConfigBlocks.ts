import { collectConfigBlocks } from './collectConfigBlocks';

import type { CodeBlockGraphicData } from '~/types';

/**
 * Represents line range information for a config block in the combined source.
 */
export interface BlockLineMapping {
	blockId: number; // creationIndex of the block
	startLine: number; // 1-based line number in combined source (inclusive)
	endLine: number; // 1-based line number in combined source (inclusive)
}

/**
 * Result of combining all config blocks into a single source.
 */
export interface CombinedConfigSource {
	source: string; // Combined source with blank line separators
	lineMappings: BlockLineMapping[]; // Line mappings for each block
}

/**
 * Combines all config blocks into a single source for validation.
 * Config blocks are sorted in creation order and concatenated with blank line separators.
 * Returns the combined source and line mappings for error attribution.
 */
export function combineConfigBlocks(codeBlocks: CodeBlockGraphicData[]): CombinedConfigSource {
	const configBlocks = collectConfigBlocks(codeBlocks);

	if (configBlocks.length === 0) {
		return { source: '', lineMappings: [] };
	}

	const lineMappings: BlockLineMapping[] = [];
	const sources: string[] = [];
	let currentLine = 1;

	for (const { block, source } of configBlocks) {
		// Handle empty source edge case - empty string split by '\n' returns [''] with length 1
		if (source.trim().length === 0) {
			continue;
		}

		const lines = source.split('\n');
		const lineCount = lines.length;

		lineMappings.push({
			blockId: block.creationIndex,
			startLine: currentLine,
			endLine: currentLine + lineCount - 1,
		});

		sources.push(source);
		currentLine += lineCount + 1; // +1 for blank line separator between blocks
	}

	return {
		source: sources.join('\n\n'), // Join with blank line separator
		lineMappings,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { createMockCodeBlock } = await import('../../pureHelpers/testingUtils/testUtils');

	describe('combineConfigBlocks', () => {
		it('should combine multiple config blocks with blank line separator', () => {
			const block1 = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const block2 = createMockCodeBlock({
				code: ['config', 'push 2', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = [block1, block2];

			const result = combineConfigBlocks(codeBlocks);
			expect(result.source).toBe('push 1\n\npush 2');
			expect(result.lineMappings).toHaveLength(2);
			expect(result.lineMappings[0]).toEqual({
				blockId: 0,
				startLine: 1,
				endLine: 1,
			});
			expect(result.lineMappings[1]).toEqual({
				blockId: 1,
				startLine: 3,
				endLine: 3,
			});
		});

		it('should handle multi-line config blocks', () => {
			const block1 = createMockCodeBlock({
				code: ['config', 'push 1', 'push 2', 'push 3', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const block2 = createMockCodeBlock({
				code: ['config', 'set x 10', 'set y 20', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = [block1, block2];

			const result = combineConfigBlocks(codeBlocks);
			expect(result.source).toBe('push 1\npush 2\npush 3\n\nset x 10\nset y 20');
			expect(result.lineMappings).toHaveLength(2);
			expect(result.lineMappings[0]).toEqual({
				blockId: 0,
				startLine: 1,
				endLine: 3,
			});
			expect(result.lineMappings[1]).toEqual({
				blockId: 1,
				startLine: 5,
				endLine: 6,
			});
		});

		it('should return empty source for no config blocks', () => {
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			});
			const codeBlocks = [moduleBlock];

			const result = combineConfigBlocks(codeBlocks);
			expect(result.source).toBe('');
			expect(result.lineMappings).toHaveLength(0);
		});

		it('should skip empty config blocks', () => {
			const emptyBlock = createMockCodeBlock({
				code: ['config', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const contentBlock = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = [emptyBlock, contentBlock];

			const result = combineConfigBlocks(codeBlocks);
			expect(result.source).toBe('push 1');
			expect(result.lineMappings).toHaveLength(1);
			expect(result.lineMappings[0]).toMatchSnapshot();
		});

		it('should maintain creation order', () => {
			const block1 = createMockCodeBlock({
				code: ['config', 'first', 'configEnd'],
				blockType: 'config',
				creationIndex: 2,
			});
			const block2 = createMockCodeBlock({
				code: ['config', 'second', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const block3 = createMockCodeBlock({
				code: ['config', 'third', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = [block1, block2, block3];

			const result = combineConfigBlocks(codeBlocks);
			expect(result.source).toBe('second\n\nthird\n\nfirst');
			expect(result.lineMappings).toHaveLength(3);
			expect(result.lineMappings).toMatchSnapshot();
		});
	});
}
