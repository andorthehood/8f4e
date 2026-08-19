import { describe, expect, expectTypeOf, it } from 'vitest';

import type { Engine } from '../engine.ts';
import { DrawContext } from './drawContext.ts';
import type { SpriteFont, SpriteTarget } from './types.ts';

type SpriteCall = Parameters<SpriteTarget['drawSprite']>;

/** Creates a structural sprite target that records every forwarded call. */
function createRecorder(): { calls: SpriteCall[]; target: SpriteTarget } {
	const calls: SpriteCall[] = [];
	return {
		calls,
		target: {
			drawSprite: (...call) => calls.push(call),
		},
	};
}

describe('DrawContext', () => {
	it('accepts the core engine through structural typing', () => {
		expectTypeOf<Engine>().toExtend<SpriteTarget>();
	});

	it('forwards sprites with the core argument order', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);

		draw.drawSprite(3, 5, 7);
		draw.drawSprite(11, 13, 17, 19, 23);

		expect(calls).toEqual([
			[3, 5, 7, undefined, undefined],
			[11, 13, 17, 19, 23],
		]);
	});

	it('accumulates nested offsets and restores them in stack order', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);

		draw.pushOffset(10, 20);
		draw.drawSprite(1, 2, 3);
		draw.pushOffset(100, 200);
		draw.drawSprite(4, 5, 6);
		draw.popOffset();
		draw.drawSprite(7, 8, 9);
		draw.popOffset();
		draw.drawSprite(11, 12, 13);

		expect(calls).toEqual([
			[11, 22, 3, undefined, undefined],
			[114, 225, 6, undefined, undefined],
			[17, 28, 9, undefined, undefined],
			[11, 12, 13, undefined, undefined],
		]);
	});

	it('reuses restored offset storage across render-like cycles', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);

		for (let frame = 0; frame < 2; frame += 1) {
			draw.pushOffset(frame * 10, frame * 20);
			draw.drawSprite(1, 2, frame);
			draw.popOffset();
		}

		expect(calls).toEqual([
			[1, 2, 0, undefined, undefined],
			[11, 22, 1, undefined, undefined],
		]);
	});

	it('draws fixed-cell glyphs in order with the active offset', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);
		const font: SpriteFont = {
			advanceX: 8,
			glyphIds: {
				65: 101,
				66: 102,
				67: 103,
			},
		};

		draw.pushOffset(10, 20);
		draw.drawText(2, 3, 'ABC', font);
		draw.popOffset();

		expect(calls).toEqual([
			[12, 23, 101],
			[20, 23, 102],
			[28, 23, 103],
		]);
	});

	it('skips undefined glyphs while preserving their cell advance', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);
		const font: SpriteFont = {
			advanceX: 6,
			glyphIds: {
				65: 4,
				66: 5,
			},
		};

		draw.drawText(1, 2, 'A B', font);

		expect(calls).toEqual([
			[1, 2, 4],
			[13, 2, 5],
		]);
	});

	it('does not submit sprites for empty text', () => {
		const { calls, target } = createRecorder();
		const draw = new DrawContext(target);

		draw.drawText(1, 2, '', { advanceX: 8, glyphIds: {} });

		expect(calls).toEqual([]);
	});
});
