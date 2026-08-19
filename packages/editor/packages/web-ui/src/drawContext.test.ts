import { describe, expect, it, vi } from 'vitest';
import { DrawContext } from './drawContext';

describe('DrawContext', () => {
	it('draws resolved sprites and fixed-cell text through nested offsets', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);
		const glyphIds = { 65: 12, 66: 13 };

		draw.pushOffset(10, 20);
		draw.drawSprite(1, 2, 7, 30, 40);
		draw.drawText(3, 4, 'AB', glyphIds);
		draw.popOffset();

		expect(target.drawSprite.mock.calls).toEqual([
			[11, 22, 7, 30, 40],
			[13, 24, 12],
			[21, 24, 13],
		]);
	});

	it('uses the updated character width and executes cache groups immediately', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);
		const callback = vi.fn(() => draw.drawText(0, 0, 'AB', { 65: 1, 66: 2 }));

		draw.setCharacterWidth(6);
		const cached = draw.cacheGroup('label', 100, 20, callback);

		expect(cached).toBe(false);
		expect(callback).toHaveBeenCalledOnce();
		expect(target.drawSprite.mock.calls).toEqual([
			[0, 0, 1],
			[6, 0, 2],
		]);
	});
});
