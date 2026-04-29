import { describe, it, expect, beforeEach, vi } from 'vitest';

import pianoKeyboard from './interaction';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('pianoKeyboard interaction', () => {
	let mockStore: StateManager<State>;
	let mockEvents: EventDispatcher;
	let mockState: State;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;

	beforeEach(() => {
		onCallbacks = new Map();

		mockState = createMockState({
			graphicHelper: {
				viewport: {
					vGrid: 10,
					hGrid: 20,
					x: 0,
					y: 0,
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
		});

		mockStore = {
			getState: vi.fn(() => mockState),
			set: vi.fn(),
		} as unknown as StateManager<State>;

		mockEvents = {
			on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
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
		const codeBlock = createMockCodeBlock({
			x: 100,
			y: 50,
			offsetX: 5,
			code: ['module test-block', 'int[] keys1 10', 'int numKeys 0', '; @piano keys1 numKeys 48', 'moduleEnd'],
		});
		codeBlock.widgets.pianoKeyboards = [
			{
				x: 20,
				y: 40,
				width: 240,
				height: 100,
				keyWidth: 10,
				keyY: 20,
				keyHeight: 80,
				blackKeyHeight: 40,
				blackKeySideY: 60,
				blackKeySideHeight: 40,
				blackKeyGapXOffset: 3.75,
				blackKeyGapY: 60,
				blackKeyGapWidth: 2.5,
				blackKeyGapHeight: 40,
				lineNumber: 3,
				keys: [],
				pressedKeys: new Set(),
				pressedKeysListMemory: {
					id: 'keys1',
					wordAlignedAddress: 5,
					wordAlignedSize: 10,
					isInteger: true,
				},
				pressedNumberOfKeysMemory: {
					id: 'numKeys',
					wordAlignedAddress: 6,
					wordAlignedSize: 1,
					isInteger: true,
				},
				startingNumber: 48,
			},
		] as never;
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		onCallbacks.get('codeBlockClick')?.({
			x: 100 + 5 + 20 + 2 * 10 + 1,
			y: 50 + 40 + 1,
			codeBlock,
		});

		expect(mockStore.set).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock.code', [
			'module test-block',
			'int[] keys1 10',
			'int numKeys 1',
			'; @piano keys1 numKeys 48',
			'init keys1[0] 50',
			'moduleEnd',
		]);

		cleanup();
	});
});
