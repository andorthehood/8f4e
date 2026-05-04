import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import { recompileDebounceDelayEditorConfigValidator } from './editorConfig';
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

	async function triggerProgrammaticCompile(delayMs = 500): Promise<void> {
		compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'graphicHelper.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		await vi.advanceTimersByTimeAsync(delayMs);
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

	it('stores AST cache stats from successful compilation results', async () => {
		mockCompileCode.mockResolvedValue({
			codeBuffer: new Uint8Array([0x00]),
			compiledModules: {},
			compiledFunctions: {},
			requiredMemoryBytes: 0,
			allocatedMemoryBytes: 65536,
			astCacheStats: { hits: 4, misses: 2 },
			hasWasmInstanceBeenReset: false,
			memoryAction: { action: 'reused' },
			initOnlyReran: false,
			byteCodeSize: 1,
		});

		await triggerProgrammaticCompile();

		expect(mockState.compiler.astCacheStats).toEqual({ hits: 4, misses: 2 });
	});

	it('registers the recompile debounce delay editor config validator', () => {
		compilerEffect(store);

		expect(mockState.editorConfigValidators.recompileDebounceDelay).toBe(recompileDebounceDelayEditorConfigValidator);
	});

	it('uses the configured recompile debounce delay', async () => {
		mockState.editorConfig.recompileDebounceDelay = 120;
		compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'graphicHelper.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		await vi.advanceTimersByTimeAsync(119);
		expect(mockCompileCode).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(mockCompileCode).toHaveBeenCalledTimes(1);
	});

	it('uses the default recompile debounce delay when the config value is absent', async () => {
		compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'graphicHelper.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		await vi.advanceTimersByTimeAsync(499);
		expect(mockCompileCode).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(mockCompileCode).toHaveBeenCalledTimes(1);
	});
});
