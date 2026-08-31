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
			line: { lineNumber: 2 },
			context: {
				codeBlockId: 'helper',
				codeBlockType: 'function',
				projectBlockId: 0,
			},
		});

		mockState = createMockState({
			callbacks: {
				compileCode: mockCompileCode,
			},
		});

		const helperBlock = createMockCodeBlock({
			name: 'helper',
			code: ['function helper', 'push 1', 'functionEnd'],
			creationIndex: 0,
			blockType: 'function',
		});

		mockState.codeBlockRendering.codeBlocks.push(helperBlock);
		mockState.codeBlockRendering.selectedCodeBlockForProgrammaticEdit = helperBlock;

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
			call => call[0] === 'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code'
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
				codeBlockId: 0,
				codeBlockType: 'function',
				message: 'Memory access is not allowed in pure functions. (19)',
			},
		]);
	});

	it('reads line number from syntax errors that expose line directly (no longer defaults to 0)', async () => {
		mockCompileCode.mockRejectedValue({
			message: 'Too many arguments for if.',
			line: { lineNumber: 3, instruction: 'if' },
			context: { projectBlockId: 0 },
		});

		await triggerProgrammaticCompile();

		expect(mockState.codeErrors.compilationErrors).toEqual([
			{
				lineNumber: 3,
				codeBlockId: 0,
				codeBlockType: undefined,
				message: 'Too many arguments for if.',
			},
		]);
	});

	it('stores the owning project path for project-scope compiler errors', async () => {
		mockCompileCode.mockRejectedValue({
			message: 'Passed constant namespace env is undefined in the parent project scope.',
			line: { lineNumber: 1, instruction: 'pass' },
			context: { projectGroupPath: 'audio' },
		});

		await triggerProgrammaticCompile();

		expect(mockState.codeErrors.compilationErrors).toEqual([
			{
				lineNumber: 1,
				codeBlockId: -1,
				codeBlockType: undefined,
				projectGroupPath: 'audio',
				message: 'Passed constant namespace env is undefined in the parent project scope.',
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
				modules: expect.any(Array),
				constants: expect.any(Array),
				functions: expect.any(Array),
				prototypes: expect.any(Array),
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

	it('includes stack analysis when code line selection is disabled', async () => {
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
				modules: expect.any(Array),
				constants: expect.any(Array),
				functions: expect.any(Array),
				prototypes: expect.any(Array),
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

	it('cancels a scheduled compilation when disposed', async () => {
		const dispose = compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		dispose();
		await vi.advanceTimersByTimeAsync(500);

		expect(mockCompileCode).not.toHaveBeenCalled();
	});

	it('passes the includes collection and resolver to the compiler callback', async () => {
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
		mockState.callbacks.resolveInclude = vi.fn(async includeId => {
			if (includeId === 'std/events/risingEdge') {
				return ['function risingEdge', '#export', 'functionEnd int'].join('\n');
			}
			if (includeId === 'std/memory/wrapPointer') {
				return [
					'function wrapPointer',
					'#export',
					'functionEnd int*',
					'',
					'function wrapPointer',
					'#export',
					'functionEnd float*',
				].join('\n');
			}
			return undefined;
		});
		const includesBlock = createMockCodeBlock({
			name: 'includes',
			code: [
				'includes',
				'; @pos 0 0',
				'include std/events/risingEdge',
				'include std/memory/wrapPointer',
				'includesEnd',
			],
			creationIndex: 10,
			blockType: 'includes',
		});
		mockState.codeBlockRendering.codeBlocks.unshift(includesBlock);
		mockState.codeBlockRendering.selectedCodeBlockForProgrammaticEdit = includesBlock;

		await triggerProgrammaticCompile();

		expect(mockCompileCode).toHaveBeenCalledWith(
			expect.objectContaining({
				includes: [expect.objectContaining({ id: 10, code: includesBlock.code })],
			}),
			expect.objectContaining({ resolveInclude: mockState.callbacks.resolveInclude })
		);
	});

	it('uses the configured recompile debounce delay', async () => {
		mockState.editorConfig.recompileDebounceDelay = 120;
		compilerEffect(store);
		const programmaticChangeCall = subscribeSpy.mock.calls.find(
			call => call[0] === 'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code'
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
			call => call[0] === 'codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code'
		);
		expect(programmaticChangeCall).toBeDefined();

		programmaticChangeCall![1]();
		await vi.advanceTimersByTimeAsync(499);
		expect(mockCompileCode).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(mockCompileCode).toHaveBeenCalledTimes(1);
	});
});
