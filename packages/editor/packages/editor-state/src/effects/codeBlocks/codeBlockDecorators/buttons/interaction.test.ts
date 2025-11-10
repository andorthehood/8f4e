import { describe, it, expect, beforeEach, vi } from 'vitest';

import button from './interaction';

import { createMockState } from '../../../../helpers/testUtils';

import type { State, EventDispatcher } from '../../../../types';

describe('button interaction', () => {
	let mockState: State;
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, Function>;
	let offCallbacks: Map<string, Function>;

	beforeEach(() => {
		onCallbacks = new Map();
		offCallbacks = new Map();

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
							testButton: {
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
			off: vi.fn((event: string, callback: Function) => {
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

		const mockCodeBlock: CodeBlockGraphicData = {
			id: 'test-block',
			extras: {
				buttons: new Map([
					[
						'testButton',
						{
							id: 'testButton',
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

		// Mock findButtonAtViewportCoordinates to return our button
		vi.mock('../../../../helpers/findButtonAtViewportCoordinates', () => ({
			default: vi.fn(() => ({
				id: 'testButton',
				onValue: 1,
				offValue: 0,
			})),
		}));

		codeBlockClickCallback?.({ x: 110, y: 110, codeBlock: mockCodeBlock });

		expect(mockState.compiler.memoryBuffer[5]).toBe(1);

		cleanup();
	});

	it('should set offValue when mouse is released', () => {
		const cleanup = button(mockState, mockEvents);
		const codeBlockClickCallback = onCallbacks.get('codeBlockClick');
		const mouseUpCallback = onCallbacks.get('mouseup');

		const mockCodeBlock: CodeBlockGraphicData = {
			id: 'test-block',
			extras: {
				buttons: new Map([
					[
						'testButton',
						{
							id: 'testButton',
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

		// First click the button
		codeBlockClickCallback?.({ x: 110, y: 110, codeBlock: mockCodeBlock });
		expect(mockState.compiler.memoryBuffer[5]).toBe(1);

		// Then release mouse
		mouseUpCallback?.();
		expect(mockState.compiler.memoryBuffer[5]).toBe(0);

		cleanup();
	});
});
