import { describe, it, expect, beforeEach, vi } from 'vitest';

import _switch from './interaction';

import { createMockCodeBlock, createMockState } from '../../../../pureHelpers/testingUtils/testUtils';

import type { State, EventDispatcher } from '../../../../types';

describe('switch interaction', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;

	beforeEach(() => {
		onCallbacks = new Map();

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
							testSwitch: {
								wordAlignedAddress: 5,
							},
						},
					},
				},
				memoryBuffer: new Int32Array(100),
			},
		});

		mockEvents = {
			on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				onCallbacks.set(event, callback);
			}),
			off: vi.fn(),
		} as unknown as EventDispatcher;
	});

	it('should register event listeners on initialization', () => {
		const cleanup = _switch(mockState, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));

		cleanup();
	});

	it('should unregister event listeners on cleanup', () => {
		const cleanup = _switch(mockState, mockEvents);
		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
	});

	it('should toggle switch from off to on', () => {
		const cleanup = _switch(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({ id: 'test-block' });
		mockCodeBlock.extras.switches = [
			{
				id: 'testSwitch',
				x: 50,
				y: 50,
				width: 40,
				height: 20,
				offValue: 0,
				onValue: 1,
			},
		];

		// Set initial value to off
		mockState.compiler.memoryBuffer[5] = 0;

		// Mock findSwitchAtViewportCoordinates to return our switch
		vi.mock('../../../../pureHelpers/findSwitchAtViewportCoordinates', () => ({
			default: vi.fn(() => ({
				id: 'testSwitch',
				onValue: 1,
				offValue: 0,
			})),
		}));

		codeBlockClickCallback?.({ x: 60, y: 60, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(1);

		cleanup();
	});

	it('should toggle switch from on to off', () => {
		const cleanup = _switch(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({ id: 'test-block' });
		mockCodeBlock.extras.switches = [
			{
				id: 'testSwitch',
				x: 50,
				y: 50,
				width: 40,
				height: 20,
				offValue: 0,
				onValue: 1,
			},
		];

		// Set initial value to on
		mockState.compiler.memoryBuffer[5] = 1;

		codeBlockClickCallback?.({ x: 60, y: 60, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(0);

		cleanup();
	});

	it('should set to off when value is neither on nor off', () => {
		const cleanup = _switch(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock = createMockCodeBlock({ id: 'test-block' });
		mockCodeBlock.extras.switches = [
			{
				id: 'testSwitch',
				x: 50,
				y: 50,
				width: 40,
				height: 20,
				offValue: 0,
				onValue: 1,
			},
		];

		// Set initial value to something else
		mockState.compiler.memoryBuffer[5] = 42;

		codeBlockClickCallback?.({ x: 60, y: 60, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(0);

		cleanup();
	});
});
