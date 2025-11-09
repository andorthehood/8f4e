import { vi, type MockInstance } from 'vitest';
import { StateManager } from '@8f4e/state-manager';

import loader from './loader';

import { createMockState } from '../helpers/testUtils';
import { createMockEventDispatcherWithVitest } from '../helpers/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../types';

import type { State, Project } from '../types';

describe('Loader - Project-specific memory configuration', () => {
	let mockState: State;
	let mockStore: StateManager<State>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();

		mockStore = {
			getState: () => mockState,
			set: vi.fn(),
		} as unknown as StateManager<State>;

		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should use default memory settings when project has no memory configuration', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall[1];

		// Create a project without memory configuration
		const projectWithoutMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
		};

		// Load the project
		loadProjectCallback({ project: projectWithoutMemory });

		// Verify compiler options use defaults
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(1048576);
	});

	it('should use project-specific memory settings when available', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall[1];

		// Create a project with custom memory configuration
		const projectWithMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
			memorySizeBytes: 500 * 65536,
		};

		// Load the project
		loadProjectCallback({ project: projectWithMemory });

		// Verify compiler options use project-specific settings
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(500 * 65536);
	});

	it('should create memory with project-specific settings', async () => {
		loader(mockStore, mockEvents, mockState);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		const loadProjectCallback = loadProjectCall[1];

		// Create a project with custom memory configuration
		const projectWithMemory: Project = {
			...EMPTY_DEFAULT_PROJECT,
			title: 'Test Project',
			memorySizeBytes: 2000 * 65536,
		};

		// Load the project
		loadProjectCallback({ project: projectWithMemory });

		// Verify the compiler options were updated
		expect(mockState.compiler.compilerOptions.memorySizeBytes).toBe(2000 * 65536);
	});
});
