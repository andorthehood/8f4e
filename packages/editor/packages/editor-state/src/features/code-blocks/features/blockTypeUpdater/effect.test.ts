import createStateManager from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import blockTypeUpdater from './effect';

describe('block type updater project scope', () => {
	it('recognizes a newly written unwrapped root constant contract', () => {
		const block = createMockCodeBlock({
			code: ['; project contract', 'const SAMPLE_RATE 48000', 'pass BLOCK_SIZE'],
			projectPath: '',
			blockType: 'unknown',
		});
		const state = createMockState({ codeBlockRendering: { codeBlocks: [block] } });
		const store = createStateManager(state);
		blockTypeUpdater(store);

		store.set('codeBlockRendering.codeBlocks', state.codeBlockRendering.codeBlocks);

		expect(block.isProjectScope).toBe(true);
	});

	it('keeps an existing project-scope block while it is temporarily empty', () => {
		const block = createMockCodeBlock({ code: [''], projectPath: '', isProjectScope: true, blockType: 'unknown' });
		const state = createMockState({ codeBlockRendering: { codeBlocks: [block] } });
		const store = createStateManager(state);
		blockTypeUpdater(store);

		store.set('codeBlockRendering.codeBlocks', state.codeBlockRendering.codeBlocks);

		expect(block.isProjectScope).toBe(true);
	});

	it('stops treating the block as project scope when it becomes a document block', () => {
		const block = createMockCodeBlock({
			code: ['module main', 'moduleEnd'],
			projectPath: '',
			isProjectScope: true,
			blockType: 'unknown',
		});
		const state = createMockState({ codeBlockRendering: { codeBlocks: [block] } });
		const store = createStateManager(state);
		blockTypeUpdater(store);

		store.set('codeBlockRendering.codeBlocks', state.codeBlockRendering.codeBlocks);

		expect(block.isProjectScope).toBe(false);
		expect(block.blockType).toBe('module');
	});
});
