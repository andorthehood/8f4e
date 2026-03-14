import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compilerEffect from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('program compiler effect', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockCompileCode: MockInstance;

	beforeEach(() => {
		mockCompileCode = vi.fn().mockRejectedValue({
			message: 'Memory access is not allowed in pure functions. (19)',
			line: { lineNumberBeforeMacroExpansion: 2 },
			context: {
				codeBlockId: 'helper',
				codeBlockType: 'function',
				currentFunctionId: 'helper',
				mode: 'function',
			},
		});

		mockState = createMockState({
			callbacks: {
				compileCode: mockCompileCode,
			},
		});

		mockState.graphicHelper.codeBlocks.push(
			createMockCodeBlock({
				id: 'function_helper',
				code: ['function helper', 'push 1', 'functionEnd'],
				creationIndex: 0,
				blockType: 'function',
			})
		);

		mockEvents = createMockEventDispatcherWithVitest();
		store = createStateManager(mockState);
	});

	it('stores code block type for compiler errors', async () => {
		vi.useFakeTimers();

		compilerEffect(store, mockEvents);

		store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig });
		await vi.runAllTimersAsync();
		vi.useRealTimers();

		expect(mockState.codeErrors.compilationErrors).toEqual([
			{
				lineNumber: 2,
				codeBlockId: 'helper',
				codeBlockType: 'function',
				message: 'Memory access is not allowed in pure functions. (19)',
			},
		]);
	});
});
