import type { SpriteFont, SpriteId } from '@8f4e/sprite-generator';
import { describe, expect, it, vi } from 'vitest';
import { DrawContext } from './drawContext';

const spriteId = (value: number) => value as SpriteId;

describe('DrawContext', () => {
	it('draws resolved sprites and fixed-cell text through nested offsets', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);
		const font = { 63: spriteId(9), 65: spriteId(12), 66: spriteId(13) } as SpriteFont;

		draw.startGroup(10, 20);
		draw.drawSprite(1, 2, spriteId(7), 30, 40);
		draw.drawText(3, 4, 'AB', font);
		draw.endGroup();

		expect(target.drawSprite.mock.calls).toEqual([
			[11, 22, 7, 30, 40],
			[13, 24, 12, undefined, undefined],
			[21, 24, 13, undefined, undefined],
		]);
	});

	it('uses the updated character width', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);

		draw.setCharacterWidth(6);
		draw.drawText(0, 0, 'AB', { 63: spriteId(9), 65: spriteId(1), 66: spriteId(2) });

		expect(target.drawSprite.mock.calls).toEqual([
			[0, 0, 1, undefined, undefined],
			[6, 0, 2, undefined, undefined],
		]);
	});

	it('owns space skipping and unsupported-character fallback outside glugglug', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);
		const font = { 63: spriteId(9), 65: spriteId(1) } as SpriteFont;

		draw.drawText(0, 0, 'A éΩ', font);

		expect(target.drawSprite.mock.calls).toEqual([
			[0, 0, 1, undefined, undefined],
			[16, 0, 9, undefined, undefined],
			[24, 0, 9, undefined, undefined],
		]);
	});

	it('draws pre-resolved cells while advancing over intentional spaces', () => {
		const target = { drawSprite: vi.fn() };
		const draw = new DrawContext(target, 8);

		draw.drawResolvedText(2, 3, [spriteId(1), null, spriteId(2)]);

		expect(target.drawSprite.mock.calls).toEqual([
			[2, 3, 1, undefined, undefined],
			[18, 3, 2, undefined, undefined],
		]);
	});
});
