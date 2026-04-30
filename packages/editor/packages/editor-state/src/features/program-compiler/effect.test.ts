import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compilerEffect from './effect';

import type { State } from '@8f4e/editor-state-types';

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
		compilerEffect(store, mockEvents);
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const compileCodeCall = onCalls.find(call => call[0] === 'compileCode');
		expect(compileCodeCall).toBeDefined();
		await compileCodeCall![1]();

		expect(mockState.codeErrors.compilationErrors).toEqual([
			{
				lineNumber: 2,
				codeBlockId: 'helper',
				codeBlockType: 'function',
				message: 'Memory access is not allowed in pure functions. (19)',
			},
		]);
	});

	it('reads line number from syntax errors that expose line directly (no longer defaults to 0)', async () => {
		mockCompileCode.mockRejectedValue({
			message: 'Too many arguments for if.',
			line: { lineNumberBeforeMacroExpansion: 3, lineNumberAfterMacroExpansion: 3, instruction: 'if' },
			context: {},
		});

		compilerEffect(store, mockEvents);
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const compileCodeCall = onCalls.find(call => call[0] === 'compileCode');
		expect(compileCodeCall).toBeDefined();
		await compileCodeCall![1]();

		expect(mockState.codeErrors.compilationErrors).toEqual([
			{
				lineNumber: 3,
				codeBlockId: '',
				codeBlockType: undefined,
				message: 'Too many arguments for if.',
			},
		]);
	});
});
