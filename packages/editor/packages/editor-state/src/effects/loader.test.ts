import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import projectImport from './projectImport';

import { createMockState } from '../helpers/testUtils';
import { createMockEventDispatcherWithVitest } from '../helpers/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../types';

import type { State, Project } from '../types';

describe('Loader - Project-specific memory configuration', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should use default memory settings when loading project', async () => {
		projectImport(store, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall![1];

		// Create a project (memory config now comes from config blocks)
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
		};

		// Load the project
		loadProjectCallback({ project });

		// Verify compiler options use defaults (config effect will update from config blocks)
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(1048576);
	});

	it('should reset memory settings to defaults when loading new project', async () => {
		// Create a separate defaultState that won't be modified
		const originalDefault = createMockState();
		const defaultMemorySize = originalDefault.compiler.compilerOptions.memorySizeBytes;

		// Set custom memory first
		mockState.compiler.compilerOptions.memorySizeBytes = 500 * 65536;

		projectImport(store, mockEvents, originalDefault);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall![1];

		// Create a project (memory config now comes from config blocks)
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
		};

		// Load the project
		loadProjectCallback({ project });

		// Verify compiler options reset to defaults (config effect will update from config blocks)
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(defaultMemorySize);
	});

	it('should reset project info to empty when loading new project', async () => {
		// Set some project info first
		mockState.projectInfo.title = 'Previous Project';
		mockState.projectInfo.author = 'Previous Author';

		projectImport(store, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		const loadProjectCallback = loadProjectCall![1];

		// Create a project (project info now comes from config blocks)
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
		};

		// Load the project
		loadProjectCallback({ project });

		// Verify project info reset to empty (config effect will update from config blocks)
		expect(mockState.projectInfo.title).toBe('');
		expect(mockState.projectInfo.author).toBe('');
	});
});
