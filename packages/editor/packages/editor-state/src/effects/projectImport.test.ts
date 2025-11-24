import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import projectImport from './projectImport';

import { createMockState } from '../helpers/testUtils';
import { createMockEventDispatcherWithVitest } from '../helpers/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../types';

import type { State, Project } from '../types';

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
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			expect(importProjectCall).toBeDefined();
		});

		it('should register loadProject event handler', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			expect(loadProjectCall).toBeDefined();
		});

		it('should register loadProjectBySlug event handler', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			expect(loadProjectBySlugCall).toBeDefined();
		});
	});

	describe('Initial session loading', () => {
		it('should load empty project when persistentStorage is disabled', async () => {
			mockState.featureFlags.persistentStorage = false;
			projectImport(store, mockEvents, mockState);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			const dispatchCalls = (mockEvents.dispatch as unknown as MockInstance).mock.calls;
			const projectLoadedCall = dispatchCalls.find(call => call[0] === 'projectLoaded');
			expect(projectLoadedCall).toBeDefined();
		});

		it('should load session from callback when persistentStorage is enabled', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				title: 'Saved Project',
			};

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadSession = vi.fn().mockResolvedValue(mockProject);

			projectImport(store, mockEvents, mockState);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.callbacks.loadSession).toHaveBeenCalled();
			expect(mockState.projectInfo.title).toBe('Saved Project');
		});

		it('should handle loadSession errors gracefully', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.featureFlags.persistentStorage = true;
			mockState.callbacks.loadSession = vi.fn().mockRejectedValue(new Error('Storage error'));

			projectImport(store, mockEvents, mockState);

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load project from storage:', expect.any(Error));

			consoleWarnSpy.mockRestore();
		});
	});

	describe('loadProject', () => {
		it('should use default memory settings when project has no memory configuration', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const projectWithoutMemory: Project = {
				...EMPTY_DEFAULT_PROJECT,
				title: 'Test Project',
			};

			loadProjectCallback({ project: projectWithoutMemory });

			expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(1048576);
		});

		it('should use project-specific memory settings when available', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const projectWithMemory: Project = {
				...EMPTY_DEFAULT_PROJECT,
				title: 'Test Project',
				memorySizeBytes: 500 * 65536,
			};

			loadProjectCallback({ project: projectWithMemory });

			expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(500 * 65536);
		});

		it('should reset compiler state when loading a project', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			// Set some existing state
			mockState.compiler.buildErrors = [{ message: 'Error', line: 1, column: 1 }];
			mockState.compiler.isCompiling = true;

			loadProjectCallback({ project: EMPTY_DEFAULT_PROJECT });

			expect(mockState.compiler.buildErrors).toEqual([]);
			expect(mockState.compiler.isCompiling).toBe(false);
			expect(mockState.compiler.codeBuffer).toEqual(new Uint8Array());
		});

		it('should dispatch projectLoaded event after loading', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			loadProjectCallback({ project: EMPTY_DEFAULT_PROJECT });

			const dispatchCalls = (mockEvents.dispatch as unknown as MockInstance).mock.calls;
			const projectLoadedCall = dispatchCalls.find(call => call[0] === 'projectLoaded');
			expect(projectLoadedCall).toBeDefined();
		});

		it('should load runtime-ready project with pre-compiled WASM', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const runtimeReadyProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				compiledWasm: 'AQIDBA==', // base64 for [1,2,3,4]
				memorySnapshot: 'AQAAAA==', // base64 for minimal Int32Array
			};

			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

			loadProjectCallback({ project: runtimeReadyProject });

			expect(consoleSpy).toHaveBeenCalledWith('[Loader] Pre-compiled WASM loaded and decoded successfully');
			expect(mockState.compiler.codeBuffer).not.toEqual(new Uint8Array());

			consoleSpy.mockRestore();
		});

		it('should handle decoding errors gracefully', () => {
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const invalidProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				compiledWasm: 'invalid-base64!!!',
				memorySnapshot: 'invalid-base64!!!',
			};

			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			loadProjectCallback({ project: invalidProject });

			expect(consoleErrorSpy).toHaveBeenCalledWith('[Loader] Failed to decode pre-compiled WASM:', expect.any(Error));
			expect(mockState.compiler.codeBuffer).toEqual(new Uint8Array());

			consoleErrorSpy.mockRestore();
		});
	});

	describe('importProject', () => {
		it('should trigger importProject callback when event is fired', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
				title: 'Imported Project',
			};

			mockState.callbacks.importProject = vi.fn().mockResolvedValue(mockProject);
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			const importProjectCallback = importProjectCall![1];

			await importProjectCallback();

			expect(mockState.callbacks.importProject).toHaveBeenCalled();
			expect(mockState.projectInfo.title).toBe('Imported Project');
		});

		it('should warn when no importProject callback is provided', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.importProject = undefined;
			projectImport(store, mockEvents, mockState);

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
			projectImport(store, mockEvents, mockState);

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
				title: 'Project from Slug',
			};

			mockState.callbacks.getProject = vi.fn().mockResolvedValue(mockProject);
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			const loadProjectBySlugCallback = loadProjectBySlugCall![1];

			await loadProjectBySlugCallback({ projectSlug: 'test-slug' });

			expect(mockState.callbacks.getProject).toHaveBeenCalledWith('test-slug');

			// Verify project was loaded by checking if projectLoaded event was dispatched
			const dispatchCalls = (mockEvents.dispatch as unknown as MockInstance).mock.calls;
			const projectLoadedCall = dispatchCalls.find(call => call[0] === 'projectLoaded');
			expect(projectLoadedCall).toBeDefined();
		});

		it('should warn when no getProject callback is provided', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.getProject = undefined;
			projectImport(store, mockEvents, mockState);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectBySlugCall = onCalls.find(call => call[0] === 'loadProjectBySlug');
			const loadProjectBySlugCallback = loadProjectBySlugCall![1];

			await loadProjectBySlugCallback({ projectSlug: 'test-slug' });

			expect(consoleWarnSpy).toHaveBeenCalledWith('No getProject callback provided');

			consoleWarnSpy.mockRestore();
		});
	});
});
