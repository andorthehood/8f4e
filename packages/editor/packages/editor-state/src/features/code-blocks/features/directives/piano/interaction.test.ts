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
	let memoryStore: Map<number, number>;

	beforeEach(() => {
		onCallbacks = new Map();
		memoryStore = new Map();

		mockState = createMockState({
			graphicHelper: {
				viewport: {
					vGrid: 10,
					hGrid: 20,
					x: 0,
					y: 0,
				},
			},
			callbacks: {
				getWordFromMemory: vi.fn((wordAlignedAddress: number) => memoryStore.get(wordAlignedAddress) ?? 0),
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

	function createCodeBlockWithPiano() {
		const codeBlock = createMockCodeBlock({
			x: 100,
			y: 50,
			offsetX: 5,
			code: ['module test-block', 'int[] notes 10', 'int noteCount 0', '; @piano notes noteCount 48', 'moduleEnd'],
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
				keys: Array.from({ length: 24 }, (_, offset) => ({
					offset,
					x: offset * 10,
					label: 'C',
					labelX: offset * 10,
					labelY: 0,
					kind: 'white',
					sprite: 'pianoKeyWhite',
					pressedOverlayX: offset * 10,
					pressedOverlayRows: [],
					pressedOverlayFont: 'fontPianoKeyWhitePressedOverlay',
				})),
				pressedKeysListMemory: {
					id: 'notes',
					wordAlignedAddress: 5,
					wordAlignedSize: 10,
					numberOfElements: 10,
					isInteger: true,
				},
				pressedNumberOfKeysMemory: {
					id: 'noteCount',
					wordAlignedAddress: 20,
					wordAlignedSize: 1,
					numberOfElements: 1,
					isInteger: true,
				},
				startingNumber: 48,
			},
		] as never;

		return codeBlock;
	}

	function clickKey(codeBlock: ReturnType<typeof createCodeBlockWithPiano>, keyOffset: number) {
		onCallbacks.get('codeBlockClick')?.({
			x: 100 + 5 + 20 + keyOffset * 10 + 1,
			y: 50 + 40 + 1,
			codeBlock,
		});
	}

	it('registers event listeners on initialization', () => {
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));

		cleanup();
	});

	it('unregisters event listeners on cleanup', () => {
		const cleanup = pianoKeyboard(mockStore, mockEvents);
		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('codeBlockClick', expect.any(Function));
	});

	it('adds a clicked key to the array default values based on the runtime memory state', () => {
		const codeBlock = createCodeBlockWithPiano();
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		clickKey(codeBlock, 2);

		expect(mockStore.set).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock.code', [
			'module test-block',
			'int[] notes 10 50',
			'int noteCount 1',
			'; @piano notes noteCount 48',
			'moduleEnd',
		]);

		cleanup();
	});

	it('removes a clicked key from the array default values based on the runtime memory state', () => {
		const codeBlock = createCodeBlockWithPiano();
		codeBlock.code = [
			'module test-block',
			'int[] notes 10 50',
			'int noteCount 1',
			'; @piano notes noteCount 48',
			'moduleEnd',
		];
		memoryStore.set(20, 1);
		memoryStore.set(5, 50);
		const cleanup = pianoKeyboard(mockStore, mockEvents);

		clickKey(codeBlock, 2);

		expect(mockStore.set).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock.code', [
			'module test-block',
			'int[] notes 10',
			'int noteCount 0',
			'; @piano notes noteCount 48',
			'moduleEnd',
		]);

		cleanup();
	});
});
