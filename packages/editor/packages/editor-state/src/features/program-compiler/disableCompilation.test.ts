import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './effect';

import projectConfigEffect from '../project-config/effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('disableAutoCompilation feature', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockCompileCode: MockInstance;
	let mockCompileConfig: MockInstance;

	beforeEach(() => {
		mockCompileCode = vi.fn().mockResolvedValue({
			compiledModules: {},
			allocatedMemorySize: 1024,
			memoryAction: { action: 'reused' },
			byteCodeSize: 0,
			hasWasmInstanceBeenReset: false,
			codeBuffer: new Uint8Array(),
		});

		mockCompileConfig = vi.fn().mockResolvedValue({
			config: {
				memorySizeBytes: 1048576,
				runtimeSettings: { runtime: 'WebWorkerLogicRuntime', sampleRate: 50 },
				disableAutoCompilation: false,
			},
			errors: [],
		});

		const moduleBlock = createMockCodeBlock({
			id: 'test-module',
			code: ['module testModule', 'moduleEnd'],
			creationIndex: 0,
			blockType: 'module',
		});

		const configBlock = createMockCodeBlock({
			id: 'config-block',
			code: ['config project', 'memorySizeBytes 1048576', 'configEnd'],
			creationIndex: 1,
			blockType: 'config',
		});

		mockState = createMockState({
			callbacks: {
				compileCode: mockCompileCode,
				compileConfig: mockCompileConfig,
			},
		});

		mockState.graphicHelper.codeBlocks.push(moduleBlock);
		mockState.graphicHelper.codeBlocks.push(configBlock);

		mockEvents = createMockEventDispatcherWithVitest();
		store = createStateManager(mockState);
	});

	describe('Project compilation', () => {
		it('should skip compilation when disableAutoCompilation is true', async () => {
			vi.useFakeTimers();
			store.set('compiledProjectConfig.disableAutoCompilation', true);

			compiler(store, mockEvents);

			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig, disableAutoCompilation: true });
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
			store.set('compiledProjectConfig.disableAutoCompilation', false);

			compiler(store, mockEvents);

			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig, disableAutoCompilation: false });
			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(mockCompileCode).toHaveBeenCalled();
		});

		it('should prioritize disableAutoCompilation check over pre-compiled WASM check', async () => {
			vi.useFakeTimers();
			mockState.callbacks.compileCode = undefined;
			const compiledModules = { mod: {} };
			store.set('compiledProjectConfig.disableAutoCompilation', true);
			mockState.initialProjectState = {
				...mockState.initialProjectState,
				compiledWasm: 'AQIDBA==',
				compiledModules,
			};

			compiler(store, mockEvents);

			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig, disableAutoCompilation: true });
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

	describe('Config compilation', () => {
		it('should compile config even when disableAutoCompilation is true', async () => {
			store.set('compiledProjectConfig.disableAutoCompilation', true);

			projectConfigEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockCompileConfig).toHaveBeenCalled();
		});

		it('should compile config normally when disableAutoCompilation is false', async () => {
			store.set('compiledProjectConfig.disableAutoCompilation', false);

			projectConfigEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockCompileConfig).toHaveBeenCalled();
		});
	});


	describe('applyConfigToState integration', () => {
		it('should set disableAutoCompilation flag from config', async () => {
			mockCompileConfig.mockResolvedValue({
				config: { disableAutoCompilation: true },
				errors: [],
			});

			projectConfigEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockState.compiledProjectConfig.disableAutoCompilation).toBe(true);
		});

		it('should not change disableAutoCompilation flag when not in config', async () => {
			store.set('compiledProjectConfig.disableAutoCompilation', false);

			mockCompileConfig.mockResolvedValue({
				config: { memorySizeBytes: 2097152 },
				errors: [],
			});

			projectConfigEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockState.compiledProjectConfig.disableAutoCompilation).toBe(false);
		});
	});
});
