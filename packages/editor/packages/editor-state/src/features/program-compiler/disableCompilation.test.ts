import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('disableAutoCompilation feature', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockCompileCode: MockInstance;

	beforeEach(() => {
		mockCompileCode = vi.fn().mockResolvedValue({
			compiledModules: {},
			requiredMemoryBytes: 1024,
			allocatedMemoryBytes: 65536,
			memoryAction: { action: 'reused' },
			byteCodeSize: 0,
			hasWasmInstanceBeenReset: false,
			codeBuffer: new Uint8Array(),
		});

		const moduleBlock = createMockCodeBlock({
			id: 'test-module',
			code: ['module testModule', 'moduleEnd'],
			creationIndex: 0,
			blockType: 'module',
		});

		const helperModuleBlock = createMockCodeBlock({
			id: 'editor-config',
			code: ['module editorConfig', '; @font ibmvga8x16', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});

		mockState = createMockState({
			callbacks: {
				compileCode: mockCompileCode,
			},
		});

		mockState.graphicHelper.codeBlocks.push(moduleBlock);
		mockState.graphicHelper.codeBlocks.push(helperModuleBlock);

		mockEvents = createMockEventDispatcherWithVitest();
		store = createStateManager(mockState);
	});

	describe('Project compilation', () => {
		it('should skip compilation when disableAutoCompilation is true', async () => {
			vi.useFakeTimers();
			compiler(store, mockEvents);
			store.set('globalEditorDirectives.disableAutoCompilation', true);

			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(mockCompileCode).not.toHaveBeenCalled();
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.codeErrors.compilationErrors).toEqual([]);
			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Compilation skipped: disableAutoCompilation flag is set') &&
						log.category === '[Compiler]'
				)
			).toBe(true);
		});

		it('should compile normally when disableAutoCompilation is false', async () => {
			vi.useFakeTimers();
			compiler(store, mockEvents);
			store.set('globalEditorDirectives.disableAutoCompilation', false);

			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(mockCompileCode).toHaveBeenCalled();
		});

		it('should prioritize disableAutoCompilation check over pre-compiled WASM check', async () => {
			vi.useFakeTimers();
			mockState.callbacks.compileCode = undefined;
			const compiledModules = { mod: {} };
			mockState.initialProjectState = {
				...mockState.initialProjectState,
				compiledWasm: 'AQIDBA==',
				compiledModules,
			};

			compiler(store, mockEvents);
			store.set('globalEditorDirectives.disableAutoCompilation', true);

			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Pre-compiled WASM loaded and decoded successfully') && log.category === '[Loader]'
				)
			).toBe(true);
			expect(mockState.compiler.compiledModules).toEqual(compiledModules);
		});
	});

	describe('@disableAutoCompilation integration', () => {
		it('should skip compilation when the global editor directive is enabled', async () => {
			vi.useFakeTimers();
			compiler(store, mockEvents);

			store.set('globalEditorDirectives.disableAutoCompilation', true);
			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(mockCompileCode).not.toHaveBeenCalled();
		});
	});
});
