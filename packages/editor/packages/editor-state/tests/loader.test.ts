import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from '../src/features/program-compiler/effect';
import configEffect from '../src/features/config-compiler/effect';
import projectImport from '../src/effects/projectImport';
import { createMockState } from '../src/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../src/pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../src/types';

import type { State, Project } from '../src/types';

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

		const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
		expect(compileConfigCall).toBeDefined();
		await compileConfigCall![1]();

		const expectedDefaultConfig = createMockState().compiledConfig;
		expect(mockState.compiledConfig).toEqual(expectedDefaultConfig);
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

		const compileConfigCall = onCalls.find(call => call[0] === 'compileConfig');
		expect(compileConfigCall).toBeDefined();
		await compileConfigCall![1]();

		const expectedDefaultConfig = createMockState().compiledConfig;
		expect(mockState.compiledConfig).toEqual(expectedDefaultConfig);
	});
});
