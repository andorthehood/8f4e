import { createMockCodeBlock, createMockEventDispatcher, createMockState } from '@8f4e/editor-state-testing';
import type { TestRuntimeState } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import codeBlockRendering from '../../effect';
import assertions from './effect';

function setup() {
	const block = createMockCodeBlock({
		code: ['module checks', 'push 1', 'assert', 'moduleEnd'],
		blockType: 'module',
		creationIndex: 7,
	});
	const state = createMockState();
	state.codeBlockRendering.codeBlocks = [block];
	state.codeBlockRendering.rootCodeBlocks = [block];
	const store = createStateManager(state);
	const result: TestRuntimeState = {
		status: 'passed',
		failures: [],
		assertionSites: [
			{
				siteId: 0,
				instruction: 'assert',
				projectBlockId: 7,
				projectGroupPath: '',
				codeBlockType: 'module',
				codeBlockId: 'checks',
				lineNumber: 2,
			},
		],
		assertions: [],
	};
	result.assertions.push({ site: result.assertionSites[0], passed: true, condition: 1, assertIndex: 0 });
	return { state, block, store, result };
}

describe('assertion marker effect', () => {
	it('reacts to parent runtime updates and clears markers when results are replaced or recompilation starts', () => {
		const { store, state, block, result } = setup();
		const dispose = assertions(store);
		store.set('runtime.values', { TestRuntime: result });
		expect(block.widgets.assertions).toHaveLength(1);
		store.set('runtime.values', { TestRuntime: { status: 'running', assertionSites: result.assertionSites } });
		expect(block.widgets.assertions).toEqual([]);
		store.set('runtime.values', { TestRuntime: result });
		store.set('compiler.isCompiling', true);
		expect(block.widgets.assertions).toEqual([]);
		store.set('runtime.values', { TestRuntime: { status: 'idle' } });
		store.set('compiler.isCompiling', false);
		expect(block.widgets.assertions).toEqual([]);
		dispose();
		store.set('runtime.values', { TestRuntime: result });
		expect(state.runtime.values.TestRuntime).toBe(result);
		expect(block.widgets.assertions).toEqual([]);
	});

	it('derives markers when navigating into another project slice', () => {
		const { store, state, block, result } = setup();
		state.codeBlockRendering.codeBlocks = [];
		state.runtime.values.TestRuntime = result;
		const dispose = assertions(store);
		expect(block.widgets.assertions).toEqual([]);
		store.set('codeBlockRendering.codeBlocks', [block]);
		expect(block.widgets.assertions).toHaveLength(1);
		dispose();
	});

	it('recomputes rectangle positions along with block layout and font dimensions', () => {
		const { store, state, block, result } = setup();
		codeBlockRendering(store, createMockEventDispatcher());
		const dispose = assertions(store);
		store.set('runtime.values', { TestRuntime: result });
		expect(block.widgets.assertions[0]).toMatchObject({ x: 8, y: 32, width: 8, height: 16 });
		state.viewport.vGrid = 10;
		state.viewport.hGrid = 20;
		store.set('info', state.info);
		expect(block.widgets.assertions[0]).toMatchObject({ x: 10, y: 40, width: 10, height: 20 });
		dispose();
	});
});
