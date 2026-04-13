import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';

import drawModules from './index';

import type { Engine } from 'glugglug';
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
		const hiddenBlock = createMockCodeBlock({
			hidden: true,
			textureCacheKey: 'hidden-block',
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
