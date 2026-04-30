import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import compiler from '../src/features/program-compiler/effect';
import projectImport from '../src/features/project-import/effect';
import { createMockState } from '../src/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../src/pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../src/features/project-import/emptyDefaultProject';

import type { State, Project } from '@8f4e/editor-state-types';

describe('Loader - Project loading', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	it('should load project without config reset plumbing', async () => {
		projectImport(store, mockEvents);
		compiler(store);

		// Get the loadProject callback
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

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

		// Get the loadProject callback
		const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
		const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
		expect(loadProjectCall).toBeDefined();

		const loadProjectCallback = loadProjectCall![1];

		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
		};

		loadProjectCallback({ project });
		expect(mockState.initialProjectState).toEqual(project);
	});
});
