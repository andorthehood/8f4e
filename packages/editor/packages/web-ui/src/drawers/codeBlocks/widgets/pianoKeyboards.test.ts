import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';

import drawPianoKeyboards from './pianoKeyboards';

import type { Engine } from 'glugglug';
import type { PianoKeyboard } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

function createMemoryViews({ int32 = [], float32 = [] }: { int32?: number[]; float32?: number[] } = {}): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(int32),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(float32),
		float64: new Float64Array(0),
	};
}

function createMockEngine(): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
		drawText: vi.fn(),
	} as unknown as Engine;
}

function createPianoKeyboardKeys(): PianoKeyboard['keys'] {
	return Array.from({ length: 24 }, (_, offset) => {
		const isBlack = [1, 3, 6, 8, 10].includes(offset % 12);
		const sprite = isBlack ? 'pianoKeyBlack' : 'pianoKeyWhite';

		return {
			offset,
			x: offset * 2,
			label: isBlack ? 'C#' : 'C',
			labelX: offset * 2,
			labelY: 0,
			isBlack,
			sprite,
			pressedOverlayX: offset * 2,
			pressedOverlayRows: isBlack ? [4, 8, 12] : [4, 8, 12, 16, 20],
			pressedOverlayFont: isBlack ? 'fontPianoKeyBlackPressedOverlay' : 'fontPianoKeyWhitePressedOverlay',
		};
	});
}

function createPianoKeyboard(overrides: Partial<PianoKeyboard> = {}): PianoKeyboard {
	return {
		x: 2,
		y: 3,
		width: 48,
		height: 24,
		keyWidth: 2,
		keyY: 4,
		keyHeight: 20,
		blackKeyHeight: 12,
		blackKeySideY: 16,
		blackKeySideHeight: 8,
		blackKeyGapXOffset: 0.75,
		blackKeyGapY: 16,
		blackKeyGapWidth: 0.5,
		blackKeyGapHeight: 8,
		lineNumber: 0,
		keys: createPianoKeyboardKeys(),
		pressedKeys: new Set(),
		pressedKeysListMemory: {
			id: 'notes',
			wordAlignedAddress: 4,
			wordAlignedSize: 12,
			isInteger: true,
		} as never,
		pressedNumberOfKeysMemory: {
			id: 'notesCount',
			wordAlignedAddress: 1,
		} as never,
		startingNumber: 48,
		...overrides,
	};
}

describe('drawPianoKeyboards', () => {
	it('draws piano keys as fill-color rectangles', () => {
		const engine = createMockEngine();
		const state = createMockState({
			viewport: {
				vGrid: 1,
				hGrid: 4,
			},
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontCode: {},
					fontPianoKeyWhitePressedOverlay: {},
					fontPianoKeyBlackPressedOverlay: {},
				} as never,
			},
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				pianoKeyboards: [createPianoKeyboard()],
			} as never,
		});

		drawPianoKeyboards(engine, state, codeBlock, createMemoryViews({ int32: [0, 2, 0, 0, 48, 49] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;

		expect(engine.startGroup).toHaveBeenCalledWith(2, 3);
		expect(drawSprite).toHaveBeenCalledWith(0, 4, 'pianoKeyWhite', 2, 20);
		expect(drawSprite).toHaveBeenCalledWith(2, 4, 'pianoKeyBlack', 2, 12);
		expect(drawSprite).toHaveBeenCalledWith(2, 16, 'pianoKeyWhite', 2, 8);
		expect(drawSprite).toHaveBeenCalledWith(2.75, 16, 'pianoKeyBlack', 0.5, 8);
		expect(drawSprite).toHaveBeenCalledWith(4, 4, 'pianoKeyWhite', 2, 20);
		expect(drawText).toHaveBeenCalledWith(0, 4, '//');
		expect(drawText).toHaveBeenCalledWith(0, 8, '//');
		expect(drawText).toHaveBeenCalledWith(0, 12, '//');
		expect(drawText).toHaveBeenCalledWith(0, 16, '//');
		expect(drawText).toHaveBeenCalledWith(0, 20, '//');
		expect(drawText).toHaveBeenCalledWith(2, 4, '//');
		expect(drawText).toHaveBeenCalledWith(2, 8, '//');
		expect(drawText).toHaveBeenCalledWith(2, 12, '//');
		expect(drawText).not.toHaveBeenCalledWith(2, 16, '//');
		expect(drawText).not.toHaveBeenCalledWith(2, 20, '//');
	});

	it('uses source-derived pressed keys when runtime memory has no pressed count yet', () => {
		const engine = createMockEngine();
		const state = createMockState({
			viewport: {
				vGrid: 1,
				hGrid: 4,
			},
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontCode: {},
					fontPianoKeyWhitePressedOverlay: {},
					fontPianoKeyBlackPressedOverlay: {},
				} as never,
			},
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				pianoKeyboards: [createPianoKeyboard({ pressedKeys: new Set([2]) })],
			} as never,
		});

		drawPianoKeyboards(engine, state, codeBlock, createMemoryViews({ int32: [0, 0, 0, 0, 0, 0] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;

		expect(drawSprite).toHaveBeenCalledWith(4, 4, 'pianoKeyWhite', 2, 20);
		expect(drawText).toHaveBeenCalledWith(4, 4, '//');
		expect(drawText).toHaveBeenCalledWith(4, 8, '//');
		expect(drawText).toHaveBeenCalledWith(4, 12, '//');
		expect(drawText).toHaveBeenCalledWith(4, 16, '//');
		expect(drawText).toHaveBeenCalledWith(4, 20, '//');
	});
});
