import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compilerEffect from './effect';

import type { State } from '@8f4e/editor-state-types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('program compiler effect', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockCompileCode: MockInstance;
	let subscribeSpy: MockInstance;

	beforeEach(() => {
		vi.useFakeTimers();

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

		const helperBlock = createMockCodeBlock({
			id: 'function_helper',
			code: ['function helper', 'push 1', 'functionEnd'],
			creationIndex: 0,
			blockType: 'function',
		});

		mockState.graphicHelper.codeBlocks.push(helperBlock);
		mockState.graphicHelper.selectedCodeBlockForProgrammaticEdit = helperBlock;

		store = createStateManager(mockState);
		subscribeSpy = vi.spyOn(store, 'subscribe') as MockInstance;
	});

	afterEach(() => {
		subscribeSpy.mockRestore();
		vi.useRealTimers();
	});

	async function triggerProgrammaticCompile(): Promise<void> {
		compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'graphicHelper.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		await vi.advanceTimersByTimeAsync(500);
	}

	it('stores code block type for compiler errors', async () => {
		await triggerProgrammaticCompile();

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

		await triggerProgrammaticCompile();

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
