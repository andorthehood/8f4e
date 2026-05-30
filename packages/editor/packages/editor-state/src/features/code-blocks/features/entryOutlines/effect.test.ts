import { describe, expect, it } from 'vitest';
import createStateManager from '@8f4e/state-manager';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';

import entryOutlines from './effect';

import type { State } from '@8f4e/editor-state-types';

describe('entryOutlines effect', () => {
	it('updates entry outline corners when code blocks change', () => {
		const state = createMockState({
			viewport: {
				vGrid: 8,
				hGrid: 16,
			},
		});
		const store = createStateManager<State>(state);
		const first = createMockCodeBlock({
			blockType: 'module',
			entry: 'main',
			x: 16,
			y: 32,
			width: 80,
			height: 40,
		});
		const second = createMockCodeBlock({
			blockType: 'module',
			entry: 'main',
			x: 160,
			y: 96,
			width: 96,
			height: 48,
		});

		entryOutlines(store);
		store.set('graphicHelper.codeBlocks', [first, second]);

		expect(state.graphicHelper.entryOutlines).toEqual([
			{
				entryName: 'main',
				topLeft: { x: -48, y: -32 },
				topRight: { x: 320, y: -32 },
				bottomRight: { x: 320, y: 208 },
				bottomLeft: { x: -48, y: 208 },
			},
		]);
	});
});
