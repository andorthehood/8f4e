import { describe, it, expect, beforeEach, vi } from 'vitest';

import crossfade from './interaction';

import type { State, EventDispatcher } from '@8f4e/editor-state-types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('crossfade interaction', () => {
	let mockState: State;
	let mockStore: { getState: () => State };
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;
	let memoryStore: Map<number, number>;
	let setWordInMemory: (wordAlignedAddress: number, value: number, isInteger: boolean) => void;

	beforeEach(() => {
		onCallbacks = new Map();
		memoryStore = new Map();
		setWordInMemory = vi.fn((wordAlignedAddress: number, value: number) => {
			memoryStore.set(wordAlignedAddress, value);
		});

		mockState = createMockState({
			viewport: {
				vGrid: 10,
				hGrid: 20,
				x: 0,
				y: 0,
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							dry: {
								wordAlignedAddress: 5,
							},
							wet: {
								wordAlignedAddress: 6,
							},
						},
					},
				},
			},
			callbacks: {
				setWordInMemory,
			},
		});

		mockStore = {
			getState: vi.fn(() => mockState),
		};

		mockEvents = {
			on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				onCallbacks.set(event, callback);
			}),
			off: vi.fn(),
		} as unknown as EventDispatcher;
	});

	function createCrossfadeCodeBlock() {
		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});

		mockCodeBlock.widgets.crossfades = [
			{
				leftId: 'dry',
				rightId: 'wet',
				leftWordAddress: 5,
				rightWordAddress: 6,
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				handleWidth: 10,
				trackWidth: 90,
				centerX: 45,
			},
		];

		return mockCodeBlock;
	}

	it('writes silence to both sides when clicked in the center', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = crossfade(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		codeBlockClickCallback?.({ x: 100, y: 60, codeBlock: createCrossfadeCodeBlock() });

		expect(memoryStore.get(5)).toBe(0.5);
		expect(memoryStore.get(6)).toBe(0.5);
		cleanup();
	});

	it('writes fully left when clicked on the left edge', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = crossfade(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		codeBlockClickCallback?.({ x: 50, y: 60, codeBlock: createCrossfadeCodeBlock() });

		expect(memoryStore.get(5)).toBe(1);
		expect(memoryStore.get(6)).toBe(0);
		cleanup();
	});

	it('updates both values during drag', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = crossfade(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseMoveCallback = onCallbacks.get('mousemove');

		codeBlockClickCallback?.({ x: 100, y: 60, codeBlock: createCrossfadeCodeBlock() });
		mouseMoveCallback?.({ x: 150, stopPropagation: false });

		expect(memoryStore.get(5)).toBe(0);
		expect(memoryStore.get(6)).toBe(1);
		cleanup();
	});

	it('stops updating when the mouse is released', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = crossfade(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseMoveCallback = onCallbacks.get('mousemove');
		const mouseUpCallback = onCallbacks.get('mouseup');

		codeBlockClickCallback?.({ x: 100, y: 60, codeBlock: createCrossfadeCodeBlock() });
		mouseUpCallback?.();
		mouseMoveCallback?.({ x: 150, stopPropagation: false });

		expect(setWordInMemory).toHaveBeenCalledTimes(2);
		cleanup();
	});
});
