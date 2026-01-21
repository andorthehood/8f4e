import { describe, it, expect } from 'vitest';

import { combineConfigBlocks } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('projectConfig error mapping', () => {
	it('should map errors to correct blocks with local line numbers', () => {
		const block1 = createMockCodeBlock({
			id: 'block1',
			code: ['projectConfig', 'push 1', 'push 2', 'projectConfigEnd'],
			blockType: 'projectConfig',
			creationIndex: 0,
		});
		const block2 = createMockCodeBlock({
			id: 'block2',
			code: ['projectConfig', 'set x 10', 'set y 20', 'projectConfigEnd'],
			blockType: 'projectConfig',
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

		// Test error mapping using the actual production function
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

	it('should handle single projectConfig block', () => {
		const block = createMockCodeBlock({
			id: 'single',
			code: ['projectConfig', 'push 1', 'push 2', 'push 3', 'projectConfigEnd'],
			blockType: 'projectConfig',
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

	it('should handle three projectConfig blocks', () => {
		const block1 = createMockCodeBlock({
			code: ['projectConfig', 'line1', 'projectConfigEnd'],
			blockType: 'projectConfig',
			creationIndex: 0,
		});
		const block2 = createMockCodeBlock({
			code: ['projectConfig', 'line2a', 'line2b', 'projectConfigEnd'],
			blockType: 'projectConfig',
			creationIndex: 1,
		});
		const block3 = createMockCodeBlock({
			code: ['projectConfig', 'line3', 'projectConfigEnd'],
			blockType: 'projectConfig',
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
