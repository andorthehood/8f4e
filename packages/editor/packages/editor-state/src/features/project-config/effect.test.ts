import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import projectConfigEffect from './effect';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

// Mock the compileConfigWithDefaults utility
vi.mock('../config-compiler/utils/compileConfigWithDefaults', () => ({
	compileConfigWithDefaults: vi.fn(),
}));

describe('projectConfigEffect - diffing behavior', () => {
	let mockState: State;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockStore: StateManager<State>;
	let mockCompileConfigWithDefaults: Mock;

	beforeEach(async () => {
		// Get the mocked module
		const { compileConfigWithDefaults } = await import('../config-compiler/utils/compileConfigWithDefaults');
		mockCompileConfigWithDefaults = compileConfigWithDefaults as Mock;

		mockState = createMockState({
			compiledProjectConfig: {
				stackHeight: 100,
				heapSize: 1024,
			},
			codeErrors: {
				projectConfigErrors: [],
				editorConfigErrors: [],
			},
			graphicHelper: {
				codeBlocks: [
					createMockCodeBlock({
						id: 'project-config',
						code: ['# config project'],
						blockType: 'config',
						configType: 'project',
					}),
				],
			},
			callbacks: {
				compileConfig: vi.fn().mockResolvedValue({
					result: { stackHeight: 100, heapSize: 1024 },
					errors: [],
				}),
			},
		});

		// Default mock response - unchanged config
		// Return the same config that's in the current state to test the no-change case
		mockCompileConfigWithDefaults.mockImplementation(async () => ({
			compiledConfig: mockState.compiledProjectConfig,
			mergedConfig: mockState.compiledProjectConfig,
			errors: mockState.codeErrors.projectConfigErrors,
			hasSource: true,
		}));

		mockEvents = createMockEventDispatcherWithVitest();

		mockStore = {
			getState: () => mockState,
			set: vi.fn((path: string, value: unknown) => {
				// Update the mock state to reflect changes
				const pathParts = path.split('.');
				if (pathParts.length === 1) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(mockState as any)[pathParts[0]] = value;
				} else if (pathParts.length === 2) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(mockState as any)[pathParts[0]][pathParts[1]] = value;
				}
			}),
			subscribe: vi.fn(),
		} as StateManager<State>;
	});

	it('should not call store.set for compiledProjectConfig when config is unchanged', async () => {
		projectConfigEffect(mockStore, mockEvents);

		// Get the rebuildProjectConfig function from the subscribe call
		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		expect(codeBlocksSubscribeCall).toBeDefined();
		const rebuildProjectConfig = codeBlocksSubscribeCall![1];

		// Call rebuildProjectConfig
		await rebuildProjectConfig();

		// Verify compileConfigWithDefaults was called
		expect(mockCompileConfigWithDefaults).toHaveBeenCalled();

		// Verify store.set was NOT called for compiledProjectConfig (because config is unchanged)
		const setCallsForProjectConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledProjectConfig'
		);
		expect(setCallsForProjectConfig).toHaveLength(0);
	});

	it('should call store.set for compiledProjectConfig when config changes', async () => {
		// Change the compiled config result
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { stackHeight: 200, heapSize: 2048 }, // Different values
			mergedConfig: { stackHeight: 200, heapSize: 2048 },
			errors: [],
			hasSource: true,
		});

		projectConfigEffect(mockStore, mockEvents);

		// Get the rebuildProjectConfig function
		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildProjectConfig = codeBlocksSubscribeCall![1];

		// Call rebuildProjectConfig
		await rebuildProjectConfig();

		// Verify store.set WAS called for compiledProjectConfig (because config changed)
		const setCallsForProjectConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledProjectConfig'
		);
		expect(setCallsForProjectConfig).toHaveLength(1);
		expect(setCallsForProjectConfig[0][1]).toEqual({ stackHeight: 200, heapSize: 2048 });
	});

	it('should not call store.set for projectConfigErrors when errors are unchanged', async () => {
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { stackHeight: 100, heapSize: 1024 },
			mergedConfig: { stackHeight: 100, heapSize: 1024 },
			errors: [], // Same as initial state
			hasSource: true,
		});

		projectConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildProjectConfig = codeBlocksSubscribeCall![1];

		await rebuildProjectConfig();

		// Verify store.set was NOT called for errors (because they're unchanged)
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.projectConfigErrors'
		);
		expect(setCallsForErrors).toHaveLength(0);
	});

	it('should call store.set for projectConfigErrors when errors change', async () => {
		const newErrors = [{ message: 'Config error', line: 1, col: 1 }];
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { stackHeight: 100, heapSize: 1024 },
			mergedConfig: { stackHeight: 100, heapSize: 1024 },
			errors: newErrors,
			hasSource: true,
		});

		projectConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildProjectConfig = codeBlocksSubscribeCall![1];

		await rebuildProjectConfig();

		// Verify store.set WAS called for errors (because they changed)
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.projectConfigErrors'
		);
		expect(setCallsForErrors).toHaveLength(1);
		expect(setCallsForErrors[0][1]).toEqual(newErrors);
	});

	it('should update errors but keep last valid config when errors are present', async () => {
		const newErrors = [{ message: 'Config error', line: 1, col: 1 }];
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { stackHeight: 200, heapSize: 2048 },
			mergedConfig: { stackHeight: 200, heapSize: 2048 },
			errors: newErrors,
			hasSource: true,
		});

		projectConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildProjectConfig = codeBlocksSubscribeCall![1];

		await rebuildProjectConfig();

		// Verify errors updated and config not updated when errors are present
		const setCallsForProjectConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledProjectConfig'
		);
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.projectConfigErrors'
		);

		expect(setCallsForProjectConfig).toHaveLength(0);
		expect(setCallsForErrors).toHaveLength(1);
	});
});
