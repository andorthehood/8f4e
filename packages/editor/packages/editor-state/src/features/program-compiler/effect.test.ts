import type { State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { recompileDebounceDelayEditorConfigValidator } from './editorConfig';
import compilerEffect from './effect';

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

	it('stores compilation stats in state.info.compiler from successful compilation results', async () => {
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

		expect(mockCompileCode).toHaveBeenCalledWith(
			expect.objectContaining({
				entries: { main: expect.any(Array) },
				functions: expect.any(Array),
				macros: expect.any(Array),
			}),
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: true,
			}
		);
		expect(mockState.info.compiler).toMatchObject({
			isCompiling: false,
			compilationTimeMs: expect.any(Number),
			wasmByteCodeBytes: 1,
			requiredMemoryBytes: 0,
			allocatedMemoryBytes: 65536,
			allocatedPages: 1,
			memoryUsagePercent: 0,
			astCacheHits: 4,
			astCacheMisses: 2,
			memoryReinitialized: false,
		});
	});

	it('disables stack analysis when code line selection is disabled', async () => {
		mockState.featureFlags.codeLineSelection = false;
		mockCompileCode.mockResolvedValue({
			codeBuffer: new Uint8Array([0x00]),
			compiledModules: {},
			compiledFunctions: {},
			requiredMemoryBytes: 0,
			allocatedMemoryBytes: 65536,
			astCacheStats: { hits: 0, misses: 0 },
			hasWasmInstanceBeenReset: false,
			memoryAction: { action: 'reused' },
			initOnlyReran: false,
			byteCodeSize: 1,
		});

		await triggerProgrammaticCompile();

		expect(mockCompileCode).toHaveBeenCalledWith(
			expect.objectContaining({
				entries: { main: expect.any(Array) },
				functions: expect.any(Array),
				macros: expect.any(Array),
			}),
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: false,
			}
		);
	});

	it('recompiles when code line selection changes so stack analysis follows the feature flag', async () => {
		mockCompileCode.mockResolvedValue({
			codeBuffer: new Uint8Array([0x00]),
			compiledModules: {},
			compiledFunctions: {},
			requiredMemoryBytes: 0,
			allocatedMemoryBytes: 65536,
			astCacheStats: { hits: 0, misses: 0 },
			hasWasmInstanceBeenReset: false,
			memoryAction: { action: 'reused' },
			initOnlyReran: false,
			byteCodeSize: 1,
		});
		compilerEffect(store);
		const featureFlagChangeCall = subscribeSpy.mock.calls.find(call => call[0] === 'featureFlags.codeLineSelection');
		expect(featureFlagChangeCall).toBeDefined();

		mockState.featureFlags.codeLineSelection = false;
		featureFlagChangeCall![1]();
		await vi.advanceTimersByTimeAsync(500);

		expect(mockCompileCode).toHaveBeenCalledWith(
			expect.objectContaining({
				entries: { main: expect.any(Array) },
				functions: expect.any(Array),
				macros: expect.any(Array),
			}),
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: false,
			}
		);

		mockState.featureFlags.codeLineSelection = true;
		featureFlagChangeCall![1]();
		await vi.advanceTimersByTimeAsync(500);

		expect(mockCompileCode).toHaveBeenLastCalledWith(
			expect.objectContaining({
				entries: { main: expect.any(Array) },
				functions: expect.any(Array),
				macros: expect.any(Array),
			}),
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: true,
			}
		);
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
