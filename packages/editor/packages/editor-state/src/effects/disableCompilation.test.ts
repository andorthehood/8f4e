import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './compiler';
import configEffect, { compileConfigForExport } from './config';

import { createMockState, createMockCodeBlock } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';

import type { State } from '../types';

describe('disableCompilation feature', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockCompileProject: MockInstance;
	let mockCompileConfig: MockInstance;

	beforeEach(() => {
		mockCompileProject = vi.fn().mockResolvedValue({
			compiledModules: {},
			codeBuffer: new Uint8Array([1, 2, 3]),
			allocatedMemorySize: 1024,
			memoryBuffer: new Int32Array(256),
			memoryBufferFloat: new Float32Array(256),
			memoryAction: { action: 'reused' },
		});

		mockCompileConfig = vi.fn().mockResolvedValue({
			config: { memorySizeBytes: 1048576 },
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
			compiler: {
				disableCompilation: false,
			},
			callbacks: {
				compileProject: mockCompileProject,
				compileConfig: mockCompileConfig,
			},
		});

		mockState.graphicHelper.codeBlocks.add(moduleBlock);
		mockState.graphicHelper.codeBlocks.add(configBlock);

		mockEvents = createMockEventDispatcherWithVitest();
		store = createStateManager(mockState);
	});

	describe('Project compilation', () => {
		it('should skip compilation when disableCompilation is true', async () => {
			store.set('compiler.disableCompilation', true);

			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const compileCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			expect(compileCall).toBeDefined();

			const onRecompileCallback = compileCall![1];
			await onRecompileCallback();

			expect(mockCompileProject).not.toHaveBeenCalled();
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.codeErrors.compilationErrors).toEqual([]);
			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Compilation skipped: disableCompilation flag is set') && log.category === '[Compiler]'
				)
			).toBe(true);
		});

		it('should compile normally when disableCompilation is false', async () => {
			store.set('compiler.disableCompilation', false);

			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const compileCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			const onRecompileCallback = compileCall![1];

			await onRecompileCallback();

			expect(mockCompileProject).toHaveBeenCalled();
		});

		it('should prioritize disableCompilation check over pre-compiled WASM check', async () => {
			store.set('compiler.disableCompilation', true);
			store.set('compiler.codeBuffer', new Uint8Array([1, 2, 3, 4, 5]));
			mockState.callbacks.compileProject = undefined;

			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const compileCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			const onRecompileCallback = compileCall![1];

			await onRecompileCallback();

			expect(
				mockState.console.logs.some(log => log.message.includes('Compilation skipped: disableCompilation flag is set'))
			).toBe(true);
			expect(mockState.console.logs.some(log => log.message.includes('Using pre-compiled WASM'))).toBe(false);
		});
	});

	describe('Config compilation', () => {
		it('should skip config compilation when disableCompilation is true', async () => {
			store.set('compiler.disableCompilation', true);

			configEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const configCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			expect(configCall).toBeDefined();

			const rebuildConfigCallback = configCall![1];
			await rebuildConfigCallback();

			expect(mockCompileConfig).not.toHaveBeenCalled();
			expect(
				mockState.console.logs.some(
					log =>
						log.message.includes('Config compilation skipped: disableCompilation flag is set') &&
						log.category === '[Config]'
				)
			).toBe(true);
		});

		it('should compile config normally when disableCompilation is false', async () => {
			store.set('compiler.disableCompilation', false);

			configEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const configCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			const rebuildConfigCallback = configCall![1];

			await rebuildConfigCallback();

			expect(mockCompileConfig).toHaveBeenCalled();
		});
	});

	describe('Runtime-ready export', () => {
		it('should skip config compilation for export when disableCompilation is true', async () => {
			mockState.compiler.disableCompilation = true;

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).not.toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('should return stored compiledConfig when disableCompilation is true and config exists', async () => {
			mockState.compiler.disableCompilation = true;
			mockState.compiler.compiledConfig = {
				memorySizeBytes: 2097152,
				selectedRuntime: 1,
			};

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).not.toHaveBeenCalled();
			expect(result).toEqual({
				memorySizeBytes: 2097152,
				selectedRuntime: 1,
			});
		});

		it('should compile config for export when disableCompilation is false', async () => {
			mockState.compiler.disableCompilation = false;

			const result = await compileConfigForExport(mockState);

			expect(mockCompileConfig).toHaveBeenCalled();
			expect(result).toEqual({ memorySizeBytes: 1048576 });
		});

		it('should return empty config when no compileConfig callback is provided', async () => {
			mockState.compiler.disableCompilation = false;
			mockState.callbacks.compileConfig = undefined;

			const result = await compileConfigForExport(mockState);

			expect(result).toEqual({});
		});
	});

	describe('applyConfigToState integration', () => {
		it('should set disableCompilation flag from config', async () => {
			mockCompileConfig.mockResolvedValue({
				config: { disableCompilation: true },
				errors: [],
			});

			configEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const configCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			const rebuildConfigCallback = configCall![1];

			await rebuildConfigCallback();

			expect(mockState.compiler.disableCompilation).toBe(true);
		});

		it('should not change disableCompilation flag when not in config', async () => {
			store.set('compiler.disableCompilation', false);

			mockCompileConfig.mockResolvedValue({
				config: { memorySizeBytes: 2097152 },
				errors: [],
			});

			configEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const configCall = onCalls.find(call => call[0] === 'codeBlockAdded');
			const rebuildConfigCallback = configCall![1];

			await rebuildConfigCallback();

			expect(mockState.compiler.disableCompilation).toBe(false);
		});
	});
});
