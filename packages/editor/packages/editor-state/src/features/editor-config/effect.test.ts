import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import editorConfigEffect from './effect';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

// Mock the compileConfigWithDefaults utility
vi.mock('../config-compiler/utils/compileConfigWithDefaults', () => ({
	compileConfigWithDefaults: vi.fn(),
}));

describe('editorConfigEffect - diffing behavior', () => {
	let mockState: State;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;
	let mockStore: StateManager<State>;
	let mockCompileConfigWithDefaults: Mock;

	beforeEach(async () => {
		// Get the mocked module
		const { compileConfigWithDefaults } = await import('../config-compiler/utils/compileConfigWithDefaults');
		mockCompileConfigWithDefaults = compileConfigWithDefaults as Mock;

		mockState = createMockState({
			compiledEditorConfig: {
				colorScheme: 'dark',
				fontSize: 14,
			},
			codeErrors: {
				projectConfigErrors: [],
				editorConfigErrors: [],
			},
			graphicHelper: {
				codeBlocks: [
					createMockCodeBlock({
						id: 'editor-config',
						code: ['# config editor'],
						blockType: 'config',
						configType: 'editor',
					}),
				],
			},
			callbacks: {
				compileConfig: vi.fn().mockResolvedValue({
					result: { colorScheme: 'dark', fontSize: 14 },
					errors: [],
				}),
			},
		});

		// Default mock response - unchanged config
		// Return the same config that's in the current state to test the no-change case
		mockCompileConfigWithDefaults.mockImplementation(async () => ({
			compiledConfig: mockState.compiledEditorConfig,
			mergedConfig: mockState.compiledEditorConfig,
			errors: mockState.codeErrors.editorConfigErrors,
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

	it('should not call store.set for compiledEditorConfig when config is unchanged', async () => {
		editorConfigEffect(mockStore, mockEvents);

		// Get the rebuildEditorConfig function from the subscribe call
		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		expect(codeBlocksSubscribeCall).toBeDefined();
		const rebuildEditorConfig = codeBlocksSubscribeCall![1];

		// Call rebuildEditorConfig
		await rebuildEditorConfig();

		// Verify compileConfigWithDefaults was called
		expect(mockCompileConfigWithDefaults).toHaveBeenCalled();

		// Verify store.set was NOT called for compiledEditorConfig (because config is unchanged)
		const setCallsForEditorConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledEditorConfig'
		);
		expect(setCallsForEditorConfig).toHaveLength(0);
	});

	it('should call store.set for compiledEditorConfig when config changes', async () => {
		// Change the compiled config result
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { colorScheme: 'light', fontSize: 16 }, // Different values
			mergedConfig: { colorScheme: 'light', fontSize: 16 },
			errors: [],
			hasSource: true,
		});

		editorConfigEffect(mockStore, mockEvents);

		// Get the rebuildEditorConfig function
		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildEditorConfig = codeBlocksSubscribeCall![1];

		// Call rebuildEditorConfig
		await rebuildEditorConfig();

		// Verify store.set WAS called for compiledEditorConfig (because config changed)
		const setCallsForEditorConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledEditorConfig'
		);
		expect(setCallsForEditorConfig).toHaveLength(1);
		expect(setCallsForEditorConfig[0][1]).toEqual({ colorScheme: 'light', fontSize: 16 });
	});

	it('should not call store.set for editorConfigErrors when errors are unchanged', async () => {
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { colorScheme: 'dark', fontSize: 14 },
			mergedConfig: { colorScheme: 'dark', fontSize: 14 },
			errors: [], // Same as initial state
			hasSource: true,
		});

		editorConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildEditorConfig = codeBlocksSubscribeCall![1];

		await rebuildEditorConfig();

		// Verify store.set was NOT called for errors (because they're unchanged)
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.editorConfigErrors'
		);
		expect(setCallsForErrors).toHaveLength(0);
	});

	it('should call store.set for editorConfigErrors when errors change', async () => {
		const newErrors = [{ message: 'Config error', line: 1, col: 1 }];
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { colorScheme: 'dark', fontSize: 14 },
			mergedConfig: { colorScheme: 'dark', fontSize: 14 },
			errors: newErrors,
			hasSource: true,
		});

		editorConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildEditorConfig = codeBlocksSubscribeCall![1];

		await rebuildEditorConfig();

		// Verify store.set WAS called for errors (because they changed)
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.editorConfigErrors'
		);
		expect(setCallsForErrors).toHaveLength(1);
		expect(setCallsForErrors[0][1]).toEqual(newErrors);
	});

	it('should update both config and errors when both change', async () => {
		const newErrors = [{ message: 'Config error', line: 1, col: 1 }];
		mockCompileConfigWithDefaults.mockResolvedValue({
			compiledConfig: { colorScheme: 'light', fontSize: 16 },
			mergedConfig: { colorScheme: 'light', fontSize: 16 },
			errors: newErrors,
			hasSource: true,
		});

		editorConfigEffect(mockStore, mockEvents);

		const codeBlocksSubscribeCall = (mockStore.subscribe as Mock).mock.calls.find(
			call => call[0] === 'graphicHelper.codeBlocks'
		);
		const rebuildEditorConfig = codeBlocksSubscribeCall![1];

		await rebuildEditorConfig();

		// Verify both were updated
		const setCallsForEditorConfig = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'compiledEditorConfig'
		);
		const setCallsForErrors = (mockStore.set as Mock).mock.calls.filter(
			call => call[0] === 'codeErrors.editorConfigErrors'
		);

		expect(setCallsForEditorConfig).toHaveLength(1);
		expect(setCallsForErrors).toHaveLength(1);
	});
});
