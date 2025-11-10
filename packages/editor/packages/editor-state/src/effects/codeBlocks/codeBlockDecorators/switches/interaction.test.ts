import { describe, it, expect, beforeEach, vi } from 'vitest';

import _switch from './interaction';

import { createMockState } from '../../../../helpers/testUtils';

import type { State, EventDispatcher, CodeBlockGraphicData } from '../../../../types';

describe('switch interaction', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, Function>;

	beforeEach(() => {
		onCallbacks = new Map();

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
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
				memoryBuffer: new Float32Array(100),
			},
		} as any);

		mockEvents = {
			on: vi.fn((event: string, callback: Function) => {
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

		const mockCodeBlock: CodeBlockGraphicData = {
			id: 'test-block',
			extras: {
				switches: new Map([
					[
						'testSwitch',
						{
							id: 'testSwitch',
							x: 100,
							y: 100,
							width: 40,
							height: 20,
							offValue: 0,
							onValue: 1,
						},
					],
				]),
			},
		} as unknown as CodeBlockGraphicData;

		// Set initial value to off
		mockState.compiler.memoryBuffer[5] = 0;

		// Mock findSwitchAtViewportCoordinates to return our switch
		vi.mock('../../../../helpers/findSwitchAtViewportCoordinates', () => ({
			default: vi.fn(() => ({
				id: 'testSwitch',
				onValue: 1,
				offValue: 0,
			})),
		}));

		codeBlockClickCallback?.({ x: 110, y: 110, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(1);

		cleanup();
	});

	it('should toggle switch from on to off', () => {
		const cleanup = _switch(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock: CodeBlockGraphicData = {
			id: 'test-block',
			extras: {
				switches: new Map([
					[
						'testSwitch',
						{
							id: 'testSwitch',
							x: 100,
							y: 100,
							width: 40,
							height: 20,
							offValue: 0,
							onValue: 1,
						},
					],
				]),
			},
		} as unknown as CodeBlockGraphicData;

		// Set initial value to on
		mockState.compiler.memoryBuffer[5] = 1;

		codeBlockClickCallback?.({ x: 110, y: 110, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(0);

		cleanup();
	});

	it('should set to off when value is neither on nor off', () => {
		const cleanup = _switch(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');

		const mockCodeBlock: CodeBlockGraphicData = {
			id: 'test-block',
			extras: {
				switches: new Map([
					[
						'testSwitch',
						{
							id: 'testSwitch',
							x: 100,
							y: 100,
							width: 40,
							height: 20,
							offValue: 0,
							onValue: 1,
						},
					],
				]),
			},
		} as unknown as CodeBlockGraphicData;

		// Set initial value to something else
		mockState.compiler.memoryBuffer[5] = 42;

		codeBlockClickCallback?.({ x: 110, y: 110, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(0);

		cleanup();
	});
});
