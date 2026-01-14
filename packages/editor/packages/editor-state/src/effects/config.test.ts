import { describe, it, expect } from 'vitest';

import { createMockCodeBlock } from '../pureHelpers/testingUtils/testUtils';
import { combineConfigBlocks } from '../pureHelpers/config/combineConfigBlocks';

describe('config error mapping', () => {
	it('should map errors to correct blocks with local line numbers', () => {
		const block1 = createMockCodeBlock({
			id: 'block1',
			code: ['config', 'push 1', 'push 2', 'configEnd'],
			blockType: 'config',
			creationIndex: 0,
		});
		const block2 = createMockCodeBlock({
			id: 'block2',
			code: ['config', 'set x 10', 'set y 20', 'configEnd'],
			blockType: 'config',
			creationIndex: 1,
		});
		const codeBlocks = [block1, block2];

		const { source, lineMappings } = combineConfigBlocks(codeBlocks);

		// Verify combined source
		expect(source).toBe('push 1\npush 2\n\nset x 10\nset y 20');

		// Verify line mappings
		expect(lineMappings).toHaveLength(2);
		expect(lineMappings[0]).toEqual({
			blockId: 0,
			startLine: 1,
			endLine: 2,
		});
		expect(lineMappings[1]).toEqual({
			blockId: 1,
			startLine: 4,
			endLine: 5,
		});

		// Test error mapping: error on line 1 should map to block1, line 1
		// Note: This duplicates the mapErrorLineToBlock logic from config.ts for test isolation
		// and to verify the mapping behavior independently
		const mapErrorLineToBlock = (
			errorLine: number,
			mappings: typeof lineMappings
		): { blockId: number; localLine: number } | null => {
			for (const mapping of mappings) {
				if (errorLine >= mapping.startLine && errorLine <= mapping.endLine) {
					return {
						blockId: mapping.blockId,
						localLine: errorLine - mapping.startLine + 1,
					};
				}
			}
			if (mappings.length > 0) {
				return {
					blockId: mappings[0].blockId,
					localLine: 1,
				};
			}
			return null;
		};

		// Error on line 1 (first line of block1)
		let mapped = mapErrorLineToBlock(1, lineMappings);
		expect(mapped).toEqual({ blockId: 0, localLine: 1 });

		// Error on line 2 (second line of block1)
		mapped = mapErrorLineToBlock(2, lineMappings);
		expect(mapped).toEqual({ blockId: 0, localLine: 2 });

		// Error on line 4 (first line of block2)
		mapped = mapErrorLineToBlock(4, lineMappings);
		expect(mapped).toEqual({ blockId: 1, localLine: 1 });

		// Error on line 5 (second line of block2)
		mapped = mapErrorLineToBlock(5, lineMappings);
		expect(mapped).toEqual({ blockId: 1, localLine: 2 });

		// Error on line 3 (blank line) should map to first block, line 1
		mapped = mapErrorLineToBlock(3, lineMappings);
		expect(mapped).toEqual({ blockId: 0, localLine: 1 });
	});

	it('should handle single config block', () => {
		const block = createMockCodeBlock({
			id: 'single',
			code: ['config', 'push 1', 'push 2', 'push 3', 'configEnd'],
			blockType: 'config',
			creationIndex: 5,
		});
		const codeBlocks = [block];

		const { source, lineMappings } = combineConfigBlocks(codeBlocks);

		expect(source).toBe('push 1\npush 2\npush 3');
		expect(lineMappings).toHaveLength(1);
		expect(lineMappings[0]).toEqual({
			blockId: 5,
			startLine: 1,
			endLine: 3,
		});
	});

	it('should handle three config blocks', () => {
		const block1 = createMockCodeBlock({
			code: ['config', 'line1', 'configEnd'],
			blockType: 'config',
			creationIndex: 0,
		});
		const block2 = createMockCodeBlock({
			code: ['config', 'line2a', 'line2b', 'configEnd'],
			blockType: 'config',
			creationIndex: 1,
		});
		const block3 = createMockCodeBlock({
			code: ['config', 'line3', 'configEnd'],
			blockType: 'config',
			creationIndex: 2,
		});
		const codeBlocks = [block1, block2, block3];

		const { source, lineMappings } = combineConfigBlocks(codeBlocks);

		expect(source).toBe('line1\n\nline2a\nline2b\n\nline3');
		expect(lineMappings).toHaveLength(3);
		expect(lineMappings[0]).toEqual({ blockId: 0, startLine: 1, endLine: 1 });
		expect(lineMappings[1]).toEqual({ blockId: 1, startLine: 3, endLine: 4 });
		expect(lineMappings[2]).toEqual({ blockId: 2, startLine: 6, endLine: 6 });
	});
});
