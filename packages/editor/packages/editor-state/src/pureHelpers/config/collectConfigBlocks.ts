import extractConfigBody from './extractConfigBody';

import type { CodeBlockGraphicData } from '../../types';

/**
 * Represents a config block source with its block reference for error mapping.
 */
export interface ConfigBlockSource {
	block: CodeBlockGraphicData;
	source: string;
}

/**
 * Collects all config blocks and returns their sources individually.
 * Config blocks are sorted in creation order.
 * Each config block is compiled independently to allow proper error mapping.
 */
export function collectConfigBlocks(codeBlocks: CodeBlockGraphicData[]): ConfigBlockSource[] {
	return codeBlocks
		.filter(block => block.blockType === 'config')
		.sort((a, b) => a.creationIndex - b.creationIndex)
		.map(block => {
			const body = extractConfigBody(block.code);
			return {
				block,
				source: body.join('\n'),
			};
		})
		.filter(item => item.source.trim().length > 0);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { createMockCodeBlock } = await import('../testingUtils/testUtils');

	describe('collectConfigBlocks', () => {
		it('should collect config blocks with their sources', () => {
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

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(2);
			expect(result[0].source).toBe('push 1');
			expect(result[0].block).toBe(block1);
			expect(result[1].source).toBe('push 2');
			expect(result[1].block).toBe(block2);
		});

		it('should sort config blocks by creationIndex', () => {
			const block1 = createMockCodeBlock({
				id: 'first',
				code: ['config', 'push first', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const block2 = createMockCodeBlock({
				id: 'second',
				code: ['config', 'push second', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const codeBlocks = [block1, block2];

			const result = collectConfigBlocks(codeBlocks);
			expect(result[0].block.id).toBe('second');
			expect(result[1].block.id).toBe('first');
		});

		it('should skip non-config blocks', () => {
			const configBlock = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 1,
			});
			const codeBlocks = [configBlock, moduleBlock];

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(1);
			expect(result[0].source).toBe('push 1');
		});

		it('should return empty array if no config blocks', () => {
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			});
			const codeBlocks = [moduleBlock];

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(0);
		});

		it('should skip config blocks with empty bodies', () => {
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

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(1);
			expect(result[0].source).toBe('push 1');
		});
	});
}
