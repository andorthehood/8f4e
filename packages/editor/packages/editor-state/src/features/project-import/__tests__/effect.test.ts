import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import projectImport from '../effect';
import compiler from '../../program-compiler/effect';
import projectConfigEffect from '../../project-config/effect';

import type { State, Project } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

describe('projectImport', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('Event wiring', () => {
		it('should register importProject event handler', () => {
			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			expect(importProjectCall).toBeDefined();
		});

		it('should register loadProject event handler', () => {
			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			expect(loadProjectCall).toBeDefined();
		});

		it('should register loadProjectBySlug event handler', () => {
			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			expect(loadProjectBySlugCall).toBeDefined();
		});
	});

	describe('Initial session loading', () => {
		it('should load empty project when persistentStorage is disabled', async () => {
			mockState.featureFlags.persistentStorage = false;
			projectImport(store, mockEvents);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.initialProjectState).toEqual(EMPTY_DEFAULT_PROJECT);
		});

		it('should load session from callback when persistentStorage is enabled', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadSession = vi.fn().mockResolvedValue(mockProject);

			projectImport(store, mockEvents);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.callbacks.loadSession).toHaveBeenCalled();
		});

		it('should handle loadSession errors gracefully', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadSession = vi.fn().mockRejectedValue(new Error('Storage error'));

			projectImport(store, mockEvents);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load project from storage:', expect.any(Error));

			consoleWarnSpy.mockRestore();
		});
	});

	describe('loadProject', () => {
		it('should clear compiled config when loading project without config blocks', async () => {
			projectImport(store, mockEvents);
			compiler(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const project: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			loadProjectCallback({ project });

			const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
			expect(compileConfigCall).toBeDefined();
			await compileConfigCall![1]();

			const expectedDefaultConfig = createMockState().compiledProjectConfig;
			expect(mockState.compiledProjectConfig).toEqual(expectedDefaultConfig);
		});

		it('should reset compiled config when loading new project without config blocks', async () => {
			mockState.compiledProjectConfig = { ...mockState.compiledProjectConfig, memorySizeBytes: 500 * 65536 };

			projectImport(store, mockEvents);
			compiler(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const project: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			loadProjectCallback({ project });

			const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
			expect(compileConfigCall).toBeDefined();
			await compileConfigCall![1]();

			const expectedDefaultConfig = createMockState().compiledProjectConfig;
			expect(mockState.compiledProjectConfig).toEqual(expectedDefaultConfig);
		});

		it('should clear compilation errors when loading a project', async () => {
			vi.useFakeTimers();
			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);
			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			// Set some existing state
			mockState.codeErrors.compilationErrors = [{ message: 'Error', lineNumber: 1, codeBlockId: '1' }];
			mockState.compiler.isCompiling = true;

			loadProjectCallback({ project: EMPTY_DEFAULT_PROJECT });
			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig });
			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(mockState.codeErrors.compilationErrors).toEqual([]);
		});

		it('should store initial project state after loading', () => {
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			loadProjectCallback({ project: EMPTY_DEFAULT_PROJECT });

			expect(mockState.initialProjectState).toEqual(EMPTY_DEFAULT_PROJECT);
		});

		it('should load runtime-ready project with pre-compiled WASM', async () => {
			vi.useFakeTimers();
			projectImport(store, mockEvents);
			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const runtimeReadyProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				compiledWasm: 'AQIDBA==', // base64 for [1,2,3,4]
				compiledModules: { mod: {} },
				memorySnapshot: 'AQAAAA==', // base64 for minimal Int32Array
			};

			await Promise.resolve();
			await Promise.resolve();

			loadProjectCallback({ project: runtimeReadyProject });
			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig });
			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(
				mockState.console.logs.some(
					log => log.message.includes('Pre-compiled WASM loaded') && log.category === '[Loader]'
				)
			).toBe(true);
			expect(mockState.compiler.compiledModules).toEqual(runtimeReadyProject.compiledModules);
		});

		it('should ignore invalid memory snapshots without crashing', async () => {
			vi.useFakeTimers();
			projectImport(store, mockEvents);
			compiler(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const invalidProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				memorySnapshot: 'invalid-base64!!!',
			};

			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			loadProjectCallback({ project: invalidProject });
			store.set('compiledProjectConfig', { ...mockState.compiledProjectConfig });
			await vi.runAllTimersAsync();
			vi.useRealTimers();

			expect(consoleErrorSpy).not.toHaveBeenCalled();
			expect(mockState.compiler.allocatedMemorySize).toBe(0);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('importProject', () => {
		it('should trigger importProject callback when event is fired', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			mockState.callbacks.importProject = vi.fn().mockResolvedValue(mockProject);
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			const importProjectCallback = importProjectCall![1];

			await importProjectCallback();

			expect(mockState.callbacks.importProject).toHaveBeenCalled();
		});

		it('should warn when no importProject callback is provided', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.importProject = undefined;
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			const importProjectCallback = importProjectCall![1];

			importProjectCallback();

			expect(consoleWarnSpy).toHaveBeenCalledWith('No importProject callback provided');

			consoleWarnSpy.mockRestore();
		});

		it('should handle import errors gracefully', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			mockState.callbacks.importProject = vi.fn().mockRejectedValue(new Error('Import failed'));
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			const importProjectCallback = importProjectCall![1];

			await importProjectCallback();

			// Need to wait for promise to settle
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load project from file:', expect.any(Error));

			consoleErrorSpy.mockRestore();
		});
	});

	describe('loadProjectBySlug', () => {
		it('should load project by slug using callback', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			mockState.callbacks.getProject = vi.fn().mockResolvedValue(mockProject);
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			const loadProjectBySlugCallback = loadProjectBySlugCall![1];

			await loadProjectBySlugCallback({ projectSlug: 'test-slug' });

			expect(mockState.callbacks.getProject).toHaveBeenCalledWith('test-slug');

			expect(mockState.initialProjectState).toEqual(mockProject);
		});

		it('should warn when no getProject callback is provided', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.getProject = undefined;
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			const loadProjectBySlugCallback = loadProjectBySlugCall![1];

			await loadProjectBySlugCallback({ projectSlug: 'test-slug' });

			expect(consoleWarnSpy).toHaveBeenCalledWith('No getProject callback provided');

			consoleWarnSpy.mockRestore();
		});
	});

	describe('Runtime-ready project loading', () => {
		it('should store compiledProjectConfig when loading a runtime-ready project', async () => {
			const runtimeReadyProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				compiledProjectConfig: {
					memorySizeBytes: 2097152,
					disableAutoCompilation: true,
					binaryAssets: [],
				},
				compiledWasm: 'base64encodedwasm',
				memorySnapshot: 'base64encodedmemory',
			};

			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			loadProjectCallback({ project: runtimeReadyProject });

			const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
			expect(compileConfigCall).toBeDefined();
			await compileConfigCall![1]();

			expect(mockState.compiledProjectConfig).toEqual({
				memorySizeBytes: 2097152,
				disableAutoCompilation: true,
				binaryAssets: [],
			});
		});

		it('should not set compiledProjectConfig when not present in project', async () => {
			const regularProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			projectImport(store, mockEvents);
			projectConfigEffect(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			loadProjectCallback({ project: regularProject });

			const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
			expect(compileConfigCall).toBeDefined();
			await compileConfigCall![1]();

			const expectedDefaultConfig = createMockState().compiledProjectConfig;
			expect(mockState.compiledProjectConfig).toEqual(expectedDefaultConfig);
		});
	});
});
