import { describe, it, expect } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import graphicHelperEffect from './effect';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('graphic helper error mapping', () => {
	it('maps typed compiler errors to function blocks', () => {
		const functionBlock = createMockCodeBlock({
			id: 'function_helper',
			code: ['function helper', 'push 1', 'functionEnd'],
			blockType: 'function',
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [functionBlock],
			},
			codeErrors: {
				compilationErrors: [
					{
						lineNumber: 2,
						codeBlockId: 'helper',
						codeBlockType: 'function',
						message: 'Memory access is not allowed in pure functions. (19)',
					},
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);

		expect(functionBlock.widgets.errorMessages).toHaveLength(1);
		expect(functionBlock.widgets.errorMessages[0].lineNumber).toBe(2);
		expect(functionBlock.widgets.errorMessages[0].message).toContain('Error:');
	});
});

describe('graphic helper hidden directive', () => {
	it('shows a hidden block only while selected', () => {
		const hiddenBlock = createMockCodeBlock({
			code: ['module hidden', '; @hidden', 'moduleEnd'],
			parsedDirectives: [
				{ prefix: '@', name: 'hidden', args: [], rawRow: 1, isTrailing: false, sourceLine: '; @hidden' },
			],
		});
		const otherBlock = createMockCodeBlock({
			id: 'other',
			code: ['module other', 'moduleEnd'],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [hiddenBlock, otherBlock],
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);
		store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);

		expect(hiddenBlock.hidden).toBe(true);

		store.set('graphicHelper.selectedCodeBlock', hiddenBlock);
		expect(hiddenBlock.hidden).toBe(false);

		store.set('graphicHelper.selectedCodeBlock', otherBlock);
		expect(hiddenBlock.hidden).toBe(true);
	});
});
