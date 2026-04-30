import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import projectImport from '../effect';
import compiler from '../../program-compiler/effect';

import type { State, Project } from '@8f4e/editor-state-types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';

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

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const importProjectCall = onCalls.find(call => call[0] === 'importProject');
			expect(importProjectCall).toBeDefined();
		});

		it('should register loadProject event handler', () => {
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			expect(loadProjectCall).toBeDefined();
		});

		it('should register loadProjectByUrl event handler', () => {
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectByUrlCall = onCalls.find(call => call[0] === 'loadProjectByUrl');
			expect(loadProjectByUrlCall).toBeDefined();
		});

		it('should register loadSession event handler', () => {
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadSessionCall = onCalls.find(call => call[0] === 'loadSession');
			expect(loadSessionCall).toBeDefined();
		});
	});

	describe('Initial session loading', () => {
		it('should load empty project when loadSession callback is absent', async () => {
			projectImport(store, mockEvents);
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadSessionCall = onCalls.find(call => call[0] === 'loadSession');
			const loadSessionCallback = loadSessionCall![1];
			await loadSessionCallback();

			expect(mockState.initialProjectState).toEqual(EMPTY_DEFAULT_PROJECT);
		});

		it('should load session from callback when provided', async () => {
			const mockProject: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};
			mockState.callbacks.loadSession = vi.fn().mockResolvedValue(mockProject);

			projectImport(store, mockEvents);
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadSessionCall = onCalls.find(call => call[0] === 'loadSession');
			const loadSessionCallback = loadSessionCall![1];
			await loadSessionCallback();

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockState.callbacks.loadSession).toHaveBeenCalled();
		});

		it('should handle loadSession errors gracefully', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			mockState.callbacks.loadSession = vi.fn().mockRejectedValue(new Error('Storage error'));

			projectImport(store, mockEvents);
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadSessionCall = onCalls.find(call => call[0] === 'loadSession');
			const loadSessionCallback = loadSessionCall![1];
			await loadSessionCallback();

			// Give time for promises to resolve
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load project from storage:', expect.any(Error));

			consoleWarnSpy.mockRestore();
		});
	});

	describe('loadProject', () => {
		it('should load project without config reset plumbing', async () => {
			projectImport(store, mockEvents);
			compiler(store);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const project: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			loadProjectCallback({ project });

			expect(mockState.initialProjectState).toEqual(project);
		});

		it('should load new project without config state', async () => {
			projectImport(store, mockEvents);
			compiler(store);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const project: Project = {
				...EMPTY_DEFAULT_PROJECT,
			};

			loadProjectCallback({ project });

			expect(mockState.initialProjectState).toEqual(project);
		});

		it('should store initial project state after loading', () => {
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			loadProjectCallback({ project: EMPTY_DEFAULT_PROJECT });

			expect(mockState.initialProjectState).toEqual(EMPTY_DEFAULT_PROJECT);
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

	describe('loadProjectByUrl', () => {
		it('should load project by url using callback', async () => {
			const mock8f4eText = '8f4e/v1\n\nmodule counter\n\nmoduleEnd';

			mockState.callbacks.getProject = vi.fn().mockResolvedValue(mock8f4eText);
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectByUrlCall = onCalls.find(call => call[0] === 'loadProjectByUrl');
			const loadProjectByUrlCallback = loadProjectByUrlCall![1];

			await loadProjectByUrlCallback({
				projectUrl: 'https://static.llllllllllll.com/8f4e/example-projects/audioBuffer.8f4e',
			});

			expect(mockState.callbacks.getProject).toHaveBeenCalledWith(
				'https://static.llllllllllll.com/8f4e/example-projects/audioBuffer.8f4e'
			);

			expect(mockState.initialProjectState.codeBlocks).toHaveLength(1);
		});

		it('should warn when no getProject callback is provided', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

			mockState.callbacks.getProject = undefined;
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectByUrlCall = onCalls.find(call => call[0] === 'loadProjectByUrl');
			const loadProjectByUrlCallback = loadProjectByUrlCall![1];

			await loadProjectByUrlCallback({
				projectUrl: 'https://static.llllllllllll.com/8f4e/example-projects/audioBuffer.8f4e',
			});

			expect(consoleWarnSpy).toHaveBeenCalledWith('No getProject callback provided');

			consoleWarnSpy.mockRestore();
		});

		it('should handle parse errors gracefully and load default project', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

			mockState.callbacks.getProject = vi.fn().mockResolvedValue('invalid .8f4e content');
			projectImport(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectByUrlCall = onCalls.find(call => call[0] === 'loadProjectByUrl');
			const loadProjectByUrlCallback = loadProjectByUrlCall![1];

			await loadProjectByUrlCallback({
				projectUrl: 'https://static.llllllllllll.com/8f4e/example-projects/audioBuffer.8f4e',
			});

			expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load project by url:', expect.any(Error));
			expect(mockState.initialProjectState).toEqual(EMPTY_DEFAULT_PROJECT);

			consoleErrorSpy.mockRestore();
		});
	});
});
