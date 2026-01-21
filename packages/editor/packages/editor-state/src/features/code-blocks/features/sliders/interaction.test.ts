import { describe, it, expect, beforeEach, vi } from 'vitest';

import slider from './interaction';

import type { State, EventDispatcher } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('slider interaction', () => {
	let mockState: State;
	let mockStore: { getState: () => State };
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;
	let offCallbacks: Map<string, (...args: unknown[]) => void>;
	let memoryStore: Map<number, number>;
	let setWordInMemory: (wordAlignedAddress: number, value: number, isInteger: boolean) => void;

	beforeEach(() => {
		onCallbacks = new Map();
		offCallbacks = new Map();
		memoryStore = new Map();
		setWordInMemory = vi.fn((wordAlignedAddress: number, value: number, isInteger: boolean) => {
			void isInteger;
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
							testSlider: {
								wordAlignedAddress: 5,
								isInteger: true,
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
			off: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				offCallbacks.set(event, callback);
			}),
		} as unknown as EventDispatcher;
	});

	it('should register event listeners on initialization', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
		expect(mockEvents.on).toHaveBeenCalledWith('mousemove', expect.any(Function));
		expect(mockEvents.on).toHaveBeenCalledWith('mouseup', expect.any(Function));

		cleanup();
	});

	it('should unregister event listeners on cleanup', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
		expect(mockEvents.off).toHaveBeenCalledWith('mousemove', expect.any(Function));
		expect(mockEvents.off).toHaveBeenCalledWith('mouseup', expect.any(Function));
	});

	it('should set value when slider is clicked', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 0,
				max: 100,
			},
		];

		// Click at 75% of slider width (should set value to 75)
		codeBlockClickCallback?.({ x: 125, y: 60, codeBlock: mockCodeBlock });

		expect(setWordInMemory).toHaveBeenCalled();
		const setValue = memoryStore.get(5);
		expect(setValue).toBeCloseTo(75, 0);

		cleanup();
	});

	it('should clamp value to min when clicked at left edge', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 10,
				max: 100,
			},
		];

		// Click at left edge
		codeBlockClickCallback?.({ x: 50, y: 60, codeBlock: mockCodeBlock });

		const setValue = memoryStore.get(5);
		expect(setValue).toBe(10);

		cleanup();
	});

	it('should clamp value to max when clicked at right edge', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 0,
				max: 100,
			},
		];

		// Click at right edge
		codeBlockClickCallback?.({ x: 150, y: 60, codeBlock: mockCodeBlock });

		const setValue = memoryStore.get(5);
		expect(setValue).toBe(100);

		cleanup();
	});

	it('should snap to step value when step is provided', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 0,
				max: 100,
				step: 10,
			},
		];

		// Click at 47% (should snap to 50)
		codeBlockClickCallback?.({ x: 97, y: 60, codeBlock: mockCodeBlock });

		const setValue = memoryStore.get(5);
		expect(setValue).toBe(50);

		cleanup();
	});

	it('should update value during drag', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseMoveCallback = onCallbacks.get('mousemove');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 0,
				max: 100,
			},
		];

		// Click to start drag
		codeBlockClickCallback?.({ x: 100, y: 60, codeBlock: mockCodeBlock });
		expect(setWordInMemory).toHaveBeenCalled();

		// Move mouse to drag
		mouseMoveCallback?.({ x: 125, stopPropagation: false });

		expect(setWordInMemory).toHaveBeenCalledTimes(2);
		const setValue = memoryStore.get(5);
		expect(setValue).toBeCloseTo(75, 0);

		cleanup();
	});

	it('should stop updating when mouse is released', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cleanup = slider(mockStore as any, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseMoveCallback = onCallbacks.get('mousemove');
		const mouseUpCallback = onCallbacks.get('mouseup');

		const mockCodeBlock = createMockCodeBlock({
			id: 'test-block',
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
		});
		mockCodeBlock.extras.sliders = [
			{
				id: 'testSlider',
				x: 50,
				y: 50,
				width: 100,
				height: 20,
				min: 0,
				max: 100,
			},
		];

		// Click to start drag
		codeBlockClickCallback?.({ x: 100, y: 60, codeBlock: mockCodeBlock });

		// Release mouse
		mouseUpCallback?.();

		// Move mouse after release (should not update)
		const callCountBeforeMove = setWordInMemory.mock.calls.length;
		mouseMoveCallback?.({ x: 125, stopPropagation: false });
		const callCountAfterMove = setWordInMemory.mock.calls.length;

		expect(callCountAfterMove).toBe(callCountBeforeMove);

		cleanup();
	});
});
