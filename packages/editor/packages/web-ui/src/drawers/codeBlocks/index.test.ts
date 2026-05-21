import { describe, expect, it, vi } from 'vitest';
import { MemoryTypes, type DataStructure } from '@8f4e/compiler-spec';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';

import { getMemoryDeclarationIdFromSourceLine, getMemoryDeclarationTooltipContent } from './drawSelectedLineHint';

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
		isPointingToPointer: false,
		isUnsigned: false,
		...overrides,
	};
}

describe('drawModules', () => {
	it('extracts named memory declaration ids from selected source lines', () => {
		expect(getMemoryDeclarationIdFromSourceLine('int value 1')).toBe('value');
		expect(getMemoryDeclarationIdFromSourceLine('int[] buffer 4 48 50')).toBe('buffer');
		expect(getMemoryDeclarationIdFromSourceLine('int 1')).toBeUndefined();
		expect(getMemoryDeclarationIdFromSourceLine('add')).toBeUndefined();
	});

	it('formats live memory declaration values for the selected line hint', () => {
		const memoryViews = createMemoryViews({ int32: [0, 42, 20, 0, 0, 123] });
		const spriteLookups = {
			fontTooltipHighlight: {},
			fontTooltipText: {},
		} as never;

		expect(
			getMemoryDeclarationTooltipContent(
				memoryViews,
				createMemory({ byteAddress: 4, wordAlignedAddress: 1 }),
				spriteLookups
			).text
		).toEqual(['address: 4', 'value: 42']);
		expect(
			getMemoryDeclarationTooltipContent(
				memoryViews,
				createMemory({
					id: 'pointer',
					type: MemoryTypes['int*'],
					byteAddress: 8,
					wordAlignedAddress: 2,
					pointeeBaseType: 'int',
				}),
				spriteLookups
			).text
		).toEqual(['address: 8', 'value: 20', 'deref: 123']);
		expect(
			getMemoryDeclarationTooltipContent(
				memoryViews,
				createMemory({
					id: 'buffer',
					byteAddress: 4,
					wordAlignedAddress: 1,
					numberOfElements: 4,
				}),
				spriteLookups
			).text
		).toEqual(['address: 4', 'value[0]: 42']);
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
				colors: [
					createTooltipColors('add (T T -- T)', fontTooltipText, [
						[0, fontTooltipHighlight],
						[3, fontTooltipText],
					]),
					createTooltipColors('Adds two numbers', fontTooltipText, []),
					createTooltipColors('before [int=1, int=2]', fontTooltipText, [
						[12, fontTooltipHighlight],
						[13, fontTooltipText],
						[19, fontTooltipHighlight],
						[20, fontTooltipText],
					]),
					createTooltipColors('after: [int=3]', fontTooltipText, [
						[12, fontTooltipHighlight],
						[13, fontTooltipText],
					]),
				] as never,
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
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			-184,
			16,
			'add'
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			-160,
			16,
			' (T T -- T)'
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			-184,
			32,
			'Adds two numbers'
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(-88, 48, '1');
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(-32, 48, '2');
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(-88, 64, '3');
		expect((engine as unknown as { setSpriteLookup: ReturnType<typeof vi.fn> }).setSpriteLookup).toHaveBeenCalledWith(
			fontTooltipHighlight
		);
		expect((engine as unknown as { setSpriteLookup: ReturnType<typeof vi.fn> }).setSpriteLookup).toHaveBeenCalledWith(
			fontTooltipText
		);
	});

	it('draws live memory declaration values in the selected line hint', () => {
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
			code: ['int value'],
			codeToRender: [],
			codeColors: [],
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					test: {
						memoryMap: {
							value: createMemory({ id: 'value', byteAddress: 4, wordAlignedAddress: 1 }),
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
				text: ['int ( -- )'],
				colors: [[]],
			},
		});
		const engine = createMockEngine();

		drawModules(engine, state, createMemoryViews({ int32: [0, 77] }));

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'address: '
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'value: '
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			'77'
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
