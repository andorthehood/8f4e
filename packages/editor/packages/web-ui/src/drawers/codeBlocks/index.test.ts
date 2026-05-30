import { describe, expect, it, vi } from 'vitest';
import { MemoryTypes, type DataStructure } from '@8f4e/compiler-spec';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';

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

function createTooltipColors(
	line: string,
	defaultLookup: object,
	transitions: Array<[number, object]>
): Array<object | undefined> {
	const colors: Array<object | undefined> = new Array(line.length).fill(undefined);
	colors[0] = defaultLookup;

	transitions.forEach(([index, lookup]) => {
		colors[index] = lookup;
	});

	return colors;
}

function createCharacters(text: string): number[] {
	return [...text].map(char => char.charCodeAt(0));
}

function createTooltipCharacters(lines: string[]): number[][] {
	return lines.map(createCharacters);
}

function createMemory(overrides: Partial<DataStructure> = {}): DataStructure {
	return {
		id: 'value',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		byteAddress: 0,
		wordAlignedSize: 1,
		wordAlignedAddress: 0,
		default: 0,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

describe('drawModules', () => {
	it('draws precomputed entry outlines before rendering code blocks', () => {
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [],
				entryOutlines: [
					{
						entryName: 'main',
						topLeft: { x: 8, y: 16 },
						topRight: { x: 104, y: 16 },
						bottomRight: { x: 104, y: 96 },
						bottomLeft: { x: 8, y: 96 },
					},
				],
				spriteLookups: {
					fillColors: {},
				} as never,
			},
			viewport: {
				vGrid: 8,
				hGrid: 16,
			},
		});
		const engine = createMockEngine({ drawCachedGroup: false });

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			1,
			8,
			16,
			'wire',
			96,
			1
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			2,
			8,
			95,
			'wire',
			96,
			1
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			3,
			8,
			16,
			'wire',
			1,
			80
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			4,
			103,
			16,
			'wire',
			1,
			80
		);
	});

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
						kind: 'white',
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

	it('draws tooltip text next to the selected line', () => {
		const fillColors = {};
		const fontCode = {};
		const fontTooltipHighlight = {};
		const fontTooltipText = {};
		const block = createMockCodeBlock({
			textureCacheKey: 'selected-block',
			width: 100,
			height: 80,
			cursor: {
				row: 1,
				col: 0,
				x: 16,
				y: 16,
			},
			codeToRender: [],
			codeColors: [],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [block],
				selectedCodeBlock: block,
				spriteLookups: {
					fillColors,
					fontCode,
					fontNumbers: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
					fontTooltipHighlight,
					fontTooltipText,
				} as never,
			},
			featureFlags: {
				codeLineSelection: true,
			},
			tooltip: {
				text: ['add (T T -- T)', 'Adds two numbers', 'before [int=1, int=2]', 'after: [int=3]'],
				characters: createTooltipCharacters([
					'add (T T -- T)',
					'Adds two numbers',
					'before [int=1, int=2]',
					'after: [int=3]',
				]),
				colors: [
					createTooltipColors('add (T T -- T)', fontTooltipText, [[0, fontTooltipHighlight]]),
					createTooltipColors('Adds two numbers', fontTooltipText, []),
					createTooltipColors('before [int=1, int=2]', fontTooltipText, [[7, fontTooltipHighlight]]),
					createTooltipColors('after: [int=3]', fontTooltipText, [[7, fontTooltipHighlight]]),
				] as never,
				lineCount: 4,
				widthChars: 'before [int=1, int=2]'.length,
				layout: {
					horizontalPadding: 8,
					width: 184,
					height: 64,
					x: -192,
					y: 16,
					lineX: -184,
				},
				highlights: [
					{
						x: -120,
						y: 48,
						width: 48,
						height: 16,
						fillColor: 'tooltipConsumedHighlight',
					},
				],
			},
			viewport: {
				vGrid: 8,
				hGrid: 16,
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-192,
			16,
			'tooltipBackground',
			184,
			64
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-120,
			48,
			'tooltipConsumedHighlight',
			48,
			16
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-184,
			16,
			'a'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-184,
			32,
			'A'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-184,
			48,
			'b'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-128,
			48,
			'['.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-184,
			64,
			'a'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			-128,
			64,
			'['.charCodeAt(0)
		);
		expect((engine as unknown as { setSpriteLookup: ReturnType<typeof vi.fn> }).setSpriteLookup).toHaveBeenCalledWith(
			fontTooltipHighlight
		);
		expect((engine as unknown as { setSpriteLookup: ReturnType<typeof vi.fn> }).setSpriteLookup).toHaveBeenCalledWith(
			fontTooltipText
		);
	});

	it('draws live memory declaration values from tooltip metadata', () => {
		const block = createMockCodeBlock({
			textureCacheKey: 'selected-memory-block',
			width: 100,
			height: 80,
			moduleId: 'test',
			cursor: {
				row: 0,
				col: 0,
				x: 16,
				y: 16,
			},
			code: ['add'],
			codeToRender: [],
			codeColors: [],
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					test: {
						memoryMap: {
							pointer: createMemory({
								id: 'pointer',
								type: MemoryTypes['int*'],
								byteAddress: 8,
								wordAlignedAddress: 2,
								pointeeBaseType: 'int',
							}),
						},
					} as never,
				},
			},
			graphicHelper: {
				codeBlocks: [block],
				selectedCodeBlock: block,
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
					fontTooltipHighlight: {},
					fontTooltipText: {},
				} as never,
			},
			featureFlags: {
				codeLineSelection: true,
			},
			tooltip: {
				text: ['int ( -- )', 'address: ', 'value: ', 'deref: '],
				characters: createTooltipCharacters(['int ( -- )', 'address: ', 'value: ', 'deref: ']),
				colors: [[], [], [], []],
				lineCount: 4,
				widthChars: 19,
				layout: {
					horizontalPadding: 8,
					width: 168,
					height: 64,
					x: -176,
					y: 16,
					lineX: -168,
				},
				liveValues: [
					{
						x: -168 + 'address: '.length * 8,
						y: 16 + 16,
						source: { kind: 'memoryAddress', moduleId: 'test', memoryId: 'pointer' },
						color: {},
					},
					{
						x: -168 + 'value: '.length * 8,
						y: 16 + 2 * 16,
						source: { kind: 'memoryValue', moduleId: 'test', memoryId: 'pointer', elementIndex: 0 },
						color: {},
					},
					{
						x: -168 + 'deref: '.length * 8,
						y: 16 + 3 * 16,
						source: {
							kind: 'memoryDereference',
							moduleId: 'test',
							memoryId: 'pointer',
							format: {
								elementWordSize: 4,
								isInteger: true,
								isUnsigned: false,
							},
						},
						color: {},
					},
				],
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews({ int32: [0, 0, 20, 0, 0, 123] }));

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'a'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'v'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'2'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'd'.charCodeAt(0)
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'1'.charCodeAt(0)
		);
	});

	it('can skip off-screen arrow indicators', () => {
		const offscreenBlock = createMockCodeBlock({
			x: 1200,
			y: 384,
			width: 100,
			height: 80,
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [offscreenBlock],
				spriteLookups: {
					fontArrow: {},
				} as never,
			},
			viewport: {
				width: 1024,
				height: 768,
				vGrid: 8,
				hGrid: 16,
				center: { x: 512, y: 384 },
				borderLineCoordinates: {
					top: { startX: 0, startY: 0, endX: 1024, endY: 0 },
					right: { startX: 1024, startY: 0, endX: 1024, endY: 768 },
					bottom: { startX: 0, startY: 768, endX: 1024, endY: 768 },
					left: { startX: 0, startY: 0, endX: 0, endY: 768 },
				},
			},
			featureFlags: {
				offscreenBlockArrows: false,
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).not.toHaveBeenCalled();
	});
});
