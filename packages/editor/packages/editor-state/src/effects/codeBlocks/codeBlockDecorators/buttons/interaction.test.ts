import { describe, it, expect, beforeEach, vi } from 'vitest';

import button from './interaction';

import { createMockCodeBlock, createMockState } from '../../../../pureHelpers/testingUtils/testUtils';

import type { State, EventDispatcher } from '../../../../types';

describe('button interaction', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;
	let offCallbacks: Map<string, (...args: unknown[]) => void>;
	let memoryStore: Map<number, number>;
	let setWordInMemory: (wordAlignedAddress: number, value: number) => void;

	beforeEach(() => {
		onCallbacks = new Map();
		offCallbacks = new Map();
		memoryStore = new Map();
		setWordInMemory = vi.fn((wordAlignedAddress: number, value: number) => {
			memoryStore.set(wordAlignedAddress, value);
		});

		mockState = createMockState({
			graphicHelper: {
				viewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							testButton: {
								wordAlignedAddress: 5,
							},
						},
					},
				},
			},
			callbacks: {
				setWordInMemory,
			},
		});

		mockEvents = {
			on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				onCallbacks.set(event, callback);
			}),
			off: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				offCallbacks.set(event, callback);
			}),
		} as unknown as EventDispatcher;
	});

	it('should register event listeners on initialization', () => {
		const cleanup = button(mockState, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
		expect(mockEvents.on).toHaveBeenCalledWith('mouseup', expect.any(Function));

		cleanup();
	});

	it('should unregister event listeners on cleanup', () => {
		const cleanup = button(mockState, mockEvents);
		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
		expect(mockEvents.off).toHaveBeenCalledWith('mouseup', expect.any(Function));
	});

	it('should set onValue when button is clicked', () => {
		const cleanup = button(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({ id: 'test-block' });
		mockCodeBlock.extras.buttons = [
			{
				id: 'testButton',
				x: 50,
				y: 50,
				width: 40,
				height: 20,
				offValue: 0,
				onValue: 1,
			},
		];

		codeBlockClickCallback?.({ x: 60, y: 60, codeBlock: mockCodeBlock });

		expect(setWordInMemory).toHaveBeenCalledWith(5, 1);
		expect(memoryStore.get(5)).toBe(1);

		cleanup();
	});

	it('should set offValue when mouse is released', () => {
		const cleanup = button(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseUpCallback = onCallbacks.get('mouseup');

		const mockCodeBlock = createMockCodeBlock({ id: 'test-block' });
		mockCodeBlock.extras.buttons = [
			{
				id: 'testButton',
				x: 50,
				y: 50,
				width: 40,
				height: 20,
				offValue: 0,
				onValue: 1,
			},
		];

		codeBlockClickCallback?.({ x: 60, y: 60, codeBlock: mockCodeBlock });
		expect(setWordInMemory).toHaveBeenCalledWith(5, 1);
		expect(memoryStore.get(5)).toBe(1);

		// Then release mouse
		mouseUpCallback?.();
		expect(setWordInMemory).toHaveBeenCalledWith(5, 0);
		expect(memoryStore.get(5)).toBe(0);

		cleanup();
	});
});
