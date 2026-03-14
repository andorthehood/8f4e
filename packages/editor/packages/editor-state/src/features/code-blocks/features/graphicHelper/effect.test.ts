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
