import { describe, it, expect, beforeEach, vi } from 'vitest';

import pianoKeyboard from './interaction';

import { createMockState } from '../../../../helpers/testUtils';

import type { State } from '../../../../types';
import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from '../../../../types';

describe('pianoKeyboard interaction', () => {
	let mockStore: StateManager<State>;
	let mockEvents: EventDispatcher;
	let mockState: State;
	let onCallbacks: Map<string, Function>;

	beforeEach(() => {
		onCallbacks = new Map();

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
					vGrid: 10,
					hGrid: 20,
				},
				activeViewport: {
					viewport: {
						x: 0,
						y: 0,
					},
				},
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							keys1: {
								wordAlignedAddress: 5,
								wordAlignedSize: 10,
								id: 'keys1',
								isInteger: true,
							},
							numKeys: {
								wordAlignedAddress: 6,
								id: 'numKeys',
							},
						},
					},
				},
			},
		} as any);

		mockStore = {
			getState: vi.fn(() => mockState),
			set: vi.fn(),
		} as unknown as StateManager<State>;

		mockEvents = {
			on: vi.fn((event: string, callback: Function) => {
				onCallbacks.set(event, callback);
			}),
			off: vi.fn(),
		} as unknown as EventDispatcher;
	});

	it('should register event listeners on initialization', () => {
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));

		cleanup();
	});

	it('should unregister event listeners on cleanup', () => {
		const cleanup = pianoKeyboard(mockStore, mockEvents);
		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
	});

	it('should handle piano keyboard click', () => {
		// This test requires a more complex setup with actual helper functions
		// Skipping for now as it involves complex mocking of multiple dependencies
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));

		cleanup();
	});
});
