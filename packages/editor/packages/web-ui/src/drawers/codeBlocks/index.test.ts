import { describe, expect, it, vi } from 'vitest';

import drawModules from './index';

import type { Engine } from 'glugglug';
import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../types';

function createMemoryViews(): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(0),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(0),
		float64: new Float64Array(0),
	};
}

describe('drawModules', () => {
	it('skips hidden blocks entirely', () => {
		const hiddenBlock = {
			hidden: true,
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
			width: 100,
			height: 50,
			codeToRender: [],
			codeColors: [],
			cursor: { x: 0, y: 0, row: 0, col: 0 },
			textureCacheKey: 'hidden-block',
			code: ['module hidden', 'moduleEnd'],
			gaps: new Map(),
			lineNumberColumnWidth: 1,
			disabled: false,
			widgets: {
				blockHighlights: [],
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons: [],
				sliders: [],
				pianoKeyboards: [],
				arrayPlotters: [],
				arrayWaves: [],
				errorMessages: [],
			},
		} as State['graphicHelper']['codeBlocks'][number];
		const state = {
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
				selectedCodeBlock: undefined,
				draggedCodeBlock: undefined,
			},
			featureFlags: {
				positionOffsetters: true,
				codeLineSelection: true,
				editing: true,
			},
			viewport: {
				x: 0,
				y: 0,
				width: 800,
				height: 600,
				vGrid: 8,
				hGrid: 16,
			},
			editorMode: 'edit',
		} as unknown as State;
		const engine = {
			startGroup: vi.fn(),
			endGroup: vi.fn(),
			cacheGroup: vi.fn(),
			setSpriteLookup: vi.fn(),
			drawSprite: vi.fn(),
			drawText: vi.fn(),
		} as unknown as Engine;

		drawModules(engine, state, createMemoryViews());

		expect((engine as unknown as { cacheGroup: ReturnType<typeof vi.fn> }).cacheGroup).not.toHaveBeenCalled();
	});
});
