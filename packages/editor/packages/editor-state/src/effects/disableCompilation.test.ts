import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './compiler';
import configEffect, { compileConfigForExport } from './config';

import { createMockState, createMockCodeBlock } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';

import type { State } from '../types';

describe('disableAutoCompilation feature', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockCompileCode: MockInstance;
	let mockCompileConfig: MockInstance;

	beforeEach(() => {
		mockCompileCode = vi.fn().mockResolvedValue({
			compiledModules: {},
			codeBuffer: new Uint8Array([1, 2, 3]),
			allocatedMemorySize: 1024,
			memoryBuffer: new Int32Array(256),
			memoryBufferFloat: new Float32Array(256),
			memoryAction: { action: 'reused' },
		});

		mockCompileConfig = vi.fn().mockResolvedValue({
			config: {
				memorySizeBytes: 1048576,
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
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
			code: ['config', 'memorySizeBytes 1048576', 'configEnd'],
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
			store.set('compiledConfig.disableAutoCompilation', true);

			compiler(store, mockEvents);

			store.set('compiledConfig', { ...mockState.compiledConfig, disableAutoCompilation: true });
			await new Promise(resolve => setTimeout(resolve, 0));

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
			store.set('compiledConfig.disableAutoCompilation', false);

			compiler(store, mockEvents);

			store.set('compiledConfig', { ...mockState.compiledConfig, disableAutoCompilation: false });
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockCompileCode).toHaveBeenCalled();
		});

		it('should prioritize disableAutoCompilation check over pre-compiled WASM check', async () => {
			mockState.callbacks.compileCode = undefined;
			store.set('compiledConfig.disableAutoCompilation', true);
			mockState.initialProjectState = {
				...mockState.initialProjectState,
				compiledWasm: 'AQIDBA==',
				compiledModules: {},
			};

			compiler(store, mockEvents);

			store.set('compiledConfig', { ...mockState.compiledConfig, disableAutoCompilation: true });
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Pre-compiled WASM loaded and decoded successfully') && log.category === '[Loader]'
				)
			).toBe(true);
			expect(mockState.compiler.codeBuffer).not.toEqual(new Uint8Array());
		});
	});

	describe('Config compilation', () => {
		it('should compile config even when disableAutoCompilation is true', async () => {
			store.set('compiledConfig.disableAutoCompilation', true);

			configEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockCompileConfig).toHaveBeenCalled();
		});

		it('should compile config normally when disableAutoCompilation is false', async () => {
			store.set('compiledConfig.disableAutoCompilation', false);

			configEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockCompileConfig).toHaveBeenCalled();
		});
	});

	describe('Runtime-ready export', () => {
		it('should compile config for export even when disableAutoCompilation is true', async () => {
			mockState.compiledConfig.disableAutoCompilation = true;

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).toHaveBeenCalled();
			expect(result).toEqual({
				memorySizeBytes: 1048576,
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				disableAutoCompilation: false,
			});
		});

		it('should compile config for export even when compiledConfig exists', async () => {
			mockState.compiledConfig.disableAutoCompilation = true;
			mockState.compiledConfig = {
				memorySizeBytes: 2097152,
				selectedRuntime: 1,
				runtimeSettings: [{ runtime: 'MainThreadLogicRuntime', sampleRate: 60 }],
				disableAutoCompilation: false,
			};

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).toHaveBeenCalled();
			expect(result).toEqual({
				memorySizeBytes: 1048576,
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				disableAutoCompilation: false,
			});
		});

		it('should compile config for export when disableAutoCompilation is false', async () => {
			mockState.compiledConfig.disableAutoCompilation = false;

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).toHaveBeenCalled();
			expect(result).toEqual({
				memorySizeBytes: 1048576,
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				disableAutoCompilation: false,
			});
		});

		it('should return empty config when no compileConfig callback is provided', async () => {
			mockState.compiledConfig.disableAutoCompilation = false;
			mockState.callbacks.compileConfig = undefined;

			const result = await compileConfigForExport(mockState);

			expect(result).toEqual(mockState.compiledConfig);
		});
	});

	describe('applyConfigToState integration', () => {
		it('should set disableAutoCompilation flag from config', async () => {
			mockCompileConfig.mockResolvedValue({
				config: { disableAutoCompilation: true },
				errors: [],
			});

			configEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockState.compiledConfig.disableAutoCompilation).toBe(true);
		});

		it('should not change disableAutoCompilation flag when not in config', async () => {
			store.set('compiledConfig.disableAutoCompilation', false);

			mockCompileConfig.mockResolvedValue({
				config: { memorySizeBytes: 2097152 },
				errors: [],
			});

			configEffect(store, mockEvents);

			store.set('graphicHelper.codeBlocks', [...mockState.graphicHelper.codeBlocks]);
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(mockState.compiledConfig.disableAutoCompilation).toBe(false);
		});
	});
});
