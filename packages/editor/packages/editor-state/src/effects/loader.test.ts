import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from './compiler';
import configEffect from './config';
import projectImport from './projectImport';

import { createMockState } from '../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../pureHelpers/testingUtils/vitestTestUtils';
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

	it('should clear compiled config when loading project without config blocks', async () => {
		projectImport(store, mockEvents);
		compiler(store, mockEvents);
		configEffect(store, mockEvents);

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

		mockEvents.dispatch('compileConfig');

		expect(mockState.compiledConfig).toEqual({});
	});

	it('should reset compiled config when loading new project without config blocks', async () => {
		mockState.compiledConfig = { memorySizeBytes: 500 * 65536 };

		projectImport(store, mockEvents);
		compiler(store, mockEvents);
		configEffect(store, mockEvents);

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

		mockEvents.dispatch('compileConfig');

		expect(mockState.compiledConfig).toEqual({});
	});
});
