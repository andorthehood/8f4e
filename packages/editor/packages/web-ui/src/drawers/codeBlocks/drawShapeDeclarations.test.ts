import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import type { Engine } from 'glugglug';
import { describe, expect, it, vi } from 'vitest';
import drawShapeDeclarations from './drawShapeDeclarations';

function createMockEngine(): Engine {
	return {
		setSpriteLookup: vi.fn(),
		drawText: vi.fn(),
	} as unknown as Engine;
}

describe('drawShapeDeclarations', () => {
	it('draws precomputed shape declaration labels', () => {
		const fontCode = {};
		const block = createMockCodeBlock({
			widgets: {
				...createMockCodeBlock().widgets,
				shapeDeclarations: [
					{ x: 24, y: 32, text: 'float* input' },
					{ x: 24, y: 48, text: 'float output' },
				],
			},
		});
		const state = createMockState({
			spriteLookups: {
				fontCode,
			} as never,
		});
		const engine = createMockEngine();

		drawShapeDeclarations(engine, state, block);

		expect(engine.setSpriteLookup).toHaveBeenCalledWith(fontCode);
		expect(engine.drawText).toHaveBeenCalledWith(24, 32, 'float* input');
		expect(engine.drawText).toHaveBeenCalledWith(24, 48, 'float output');
	});

	it('skips drawing when there are no precomputed labels', () => {
		const block = createMockCodeBlock();
		const state = createMockState({
			spriteLookups: {
				fontCode: {},
			} as never,
		});
		const engine = createMockEngine();

		drawShapeDeclarations(engine, state, block);

		expect(engine.drawText).not.toHaveBeenCalled();
	});
});
