import { describe, expect, it, vi } from 'vitest';
import { DrawContext } from './drawContext';

describe('DrawContext', () => {
	it('draws resolved sprites and fixed-cell text through nested offsets', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);
		const glyphIds = { 65: 12, 66: 13 };

		draw.startGroup(10, 20);
		draw.drawSprite(1, 2, 7, 30, 40);
		draw.drawText(3, 4, 'AB', glyphIds);
		draw.endGroup();

		expect(target.drawSprite.mock.calls).toEqual([
			[11, 22, 7, 30, 40],
			[13, 24, 12],
			[21, 24, 13],
		]);
	});

	it('uses the updated character width', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);

		draw.setCharacterWidth(6);
		draw.drawText(0, 0, 'AB', { 65: 1, 66: 2 });

		expect(target.drawSprite.mock.calls).toEqual([
			[0, 0, 1],
			[6, 0, 2],
		]);
	});
});
