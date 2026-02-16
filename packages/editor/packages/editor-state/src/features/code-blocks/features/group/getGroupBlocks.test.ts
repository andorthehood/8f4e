import { describe, it, expect } from 'vitest';

import { getGroupBlocks, getGroupModuleBlocks } from './getGroupBlocks';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('getGroupBlocks', () => {
	it('should return all blocks with matching group name', () => {
		const block1 = createMockCodeBlock({ groupName: 'audio-chain' });
		const block2 = createMockCodeBlock({ groupName: 'audio-chain' });
		const block3 = createMockCodeBlock({ groupName: 'other-group' });
		const block4 = createMockCodeBlock({ groupName: undefined });

		const result = getGroupBlocks([block1, block2, block3, block4], 'audio-chain');

		expect(result).toEqual([block1, block2]);
	});

	it('should return empty array when no blocks match', () => {
		const block1 = createMockCodeBlock({ groupName: 'other-group' });
		const block2 = createMockCodeBlock({ groupName: undefined });

		const result = getGroupBlocks([block1, block2], 'audio-chain');

		expect(result).toEqual([]);
	});

	it('should return empty array when input is empty', () => {
		const result = getGroupBlocks([], 'audio-chain');

		expect(result).toEqual([]);
	});
});

describe('getGroupModuleBlocks', () => {
	it('should return only module blocks with matching group name', () => {
		const moduleBlock1 = createMockCodeBlock({ groupName: 'audio-chain', blockType: 'module' });
		const moduleBlock2 = createMockCodeBlock({ groupName: 'audio-chain', blockType: 'module' });
		const functionBlock = createMockCodeBlock({ groupName: 'audio-chain', blockType: 'function' });
		const otherModule = createMockCodeBlock({ groupName: 'other-group', blockType: 'module' });

		const result = getGroupModuleBlocks([moduleBlock1, moduleBlock2, functionBlock, otherModule], 'audio-chain');

		expect(result).toEqual([moduleBlock1, moduleBlock2]);
	});

	it('should return empty array when no module blocks match', () => {
		const functionBlock = createMockCodeBlock({ groupName: 'audio-chain', blockType: 'function' });
		const otherModule = createMockCodeBlock({ groupName: 'other-group', blockType: 'module' });

		const result = getGroupModuleBlocks([functionBlock, otherModule], 'audio-chain');

		expect(result).toEqual([]);
	});

	it('should return empty array when input is empty', () => {
		const result = getGroupModuleBlocks([], 'audio-chain');

		expect(result).toEqual([]);
	});
});
