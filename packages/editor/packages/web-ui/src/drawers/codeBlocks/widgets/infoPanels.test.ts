import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';

import drawInfoPanels from './infoPanels';

import type { Engine } from 'glugglug';

function createMockEngine(): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
		drawText: vi.fn(),
	} as unknown as Engine;
}

describe('drawInfoPanels', () => {
	it('renders key value rows from state.info', () => {
		const engine = createMockEngine();
		const state = createMockState({
			info: {
				foo: {
					a: 1,
					bar: 'foo',
					skip: { nested: true },
					foo: 1.234567,
				},
			},
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontCode: {},
					fontCodeComment: {},
					fontNumbers: {},
				} as never,
			},
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				infoPanels: [{ x: 24, y: 32, width: 216, height: 48, id: 'foo', rowCount: 3, keyColumnWidth: 3 }],
			} as never,
		});

		drawInfoPanels(engine, state, codeBlock);

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;

		expect(drawSprite).toHaveBeenCalledWith(0, 0, 'plotterBackground', 216, 48);
		expect(drawText).toHaveBeenCalledWith(0, 0, 'a');
		expect(drawText).toHaveBeenCalledWith(24, 0, ':');
		expect(drawText).toHaveBeenCalledWith(40, 0, '1');
		expect(drawText).toHaveBeenCalledWith(0, 32, 'foo');
		expect(drawText).toHaveBeenCalledWith(40, 32, '1.2346');
		expect(drawText).not.toHaveBeenCalledWith(0, 32, 'skip');
	});

	it('skips missing info records', () => {
		const engine = createMockEngine();
		const state = createMockState({
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontCode: {},
					fontCodeComment: {},
					fontNumbers: {},
				} as never,
			},
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				infoPanels: [{ x: 24, y: 32, width: 216, height: 48, id: 'missing', rowCount: 3, keyColumnWidth: 3 }],
			} as never,
		});

		drawInfoPanels(engine, state, codeBlock);

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).not.toHaveBeenCalled();
	});

	it('does not render overflowing values when no value cells are available', () => {
		const engine = createMockEngine();
		const state = createMockState({
			info: {
				foo: {
					longKey: 'overflow',
				},
			},
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontCode: {},
					fontCodeComment: {},
					fontNumbers: {},
				} as never,
			},
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				infoPanels: [{ x: 24, y: 32, width: 72, height: 16, id: 'foo', rowCount: 1, keyColumnWidth: 7 }],
			} as never,
		});

		drawInfoPanels(engine, state, codeBlock);

		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;

		expect(drawText).toHaveBeenCalledWith(0, 0, 'longKey');
		expect(drawText).toHaveBeenCalledWith(56, 0, ':');
		expect(drawText).toHaveBeenCalledWith(72, 0, '');
		expect(drawText).not.toHaveBeenCalledWith(72, 0, 'overflow');
	});
});
