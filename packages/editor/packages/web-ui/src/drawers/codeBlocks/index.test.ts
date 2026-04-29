import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';

import drawModules from './index';

import type { Engine } from 'glugglug';
import type { MemoryViews } from '../../types';

function createMemoryViews({ int32 = [] }: { int32?: number[] } = {}): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(int32),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(0),
		float64: new Float64Array(0),
	};
}

function createMockEngine({ drawCachedGroup = true }: { drawCachedGroup?: boolean } = {}): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		cacheGroup: vi.fn((_key, _width, _height, draw) => {
			if (drawCachedGroup) {
				draw();
			}
		}),
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
		drawText: vi.fn(),
	} as unknown as Engine;
}

describe('drawModules', () => {
	it('renders only the corners for hidden blocks by default', () => {
		const hiddenBlock = createMockCodeBlock({
			hidden: true,
			textureCacheKey: 'hidden-block',
			width: 100,
			height: 50,
			codeToRender: [],
			codeColors: [],
			code: ['module hidden', 'moduleEnd'],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [hiddenBlock],
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
			featureFlags: {
				positionOffsetters: true,
				codeLineSelection: true,
				editing: true,
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { cacheGroup: ReturnType<typeof vi.fn> }).cacheGroup).toHaveBeenCalled();
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledTimes(4);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).not.toHaveBeenCalled();
	});

	it('renders hidden blocks when the reveal override is active', () => {
		const hiddenBlock = createMockCodeBlock({
			hidden: true,
			textureCacheKey: 'hidden-block',
			width: 100,
			height: 50,
			codeToRender: [],
			codeColors: [],
			code: ['module hidden', 'moduleEnd'],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [hiddenBlock],
				showHiddenCodeBlocks: true,
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
			featureFlags: {
				positionOffsetters: true,
				codeLineSelection: true,
				editing: true,
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { cacheGroup: ReturnType<typeof vi.fn> }).cacheGroup).toHaveBeenCalled();
	});

	it('draws piano keyboards outside cached block textures', () => {
		const block = createMockCodeBlock({
			textureCacheKey: 'cached-block',
			width: 100,
			height: 80,
			codeToRender: [],
			codeColors: [],
		});
		block.widgets.pianoKeyboards = [
			{
				x: 0,
				y: 16,
				width: 48,
				height: 20,
				keyWidth: 2,
				keyY: 16,
				keyHeight: 4,
				blackKeyHeight: 2,
				blackKeySideY: 18,
				blackKeySideHeight: 2,
				blackKeyGapXOffset: 0.75,
				blackKeyGapY: 18,
				blackKeyGapWidth: 0.5,
				blackKeyGapHeight: 2,
				lineNumber: 0,
				keys: [
					{
						offset: 0,
						x: 0,
						label: 'C',
						labelX: 0,
						labelY: 0,
						isBlack: false,
						sprite: 'pianoKeyWhite',
						pressedOverlayX: 0,
						pressedOverlayRows: [16],
						pressedOverlayFont: 'fontPianoKeyWhitePressedOverlay',
					},
				],
				pressedKeysListMemory: {
					id: 'notes',
					wordAlignedAddress: 0,
					wordAlignedSize: 12,
					isInteger: true,
				},
				pressedNumberOfKeysMemory: {
					id: 'noteCount',
					wordAlignedAddress: 12,
					wordAlignedSize: 1,
					isInteger: true,
				},
				startingNumber: 48,
			},
		] as never;
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [block],
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontPianoKeyWhitePressedOverlay: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
		});
		const engine = createMockEngine({ drawCachedGroup: false });

		drawModules(engine, state, createMemoryViews({ int32: [48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] }));

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			0,
			16,
			'pianoKeyWhite',
			2,
			4
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(0, 16, '//');
	});
});
