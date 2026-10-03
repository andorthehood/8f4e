import type { SpriteId, SpriteIdentifier } from 'glugglugglug';
import { describe, expect, it, vi } from 'vitest';
import { createBackgroundSprite } from './background-atlas';
import type { SpriteData } from './index';

describe('web-ui background composition', () => {
	it.each([
		[8, 16],
		[6, 10],
	])('composes alternating fill rectangles with %sx%s cells', (width, height) => {
		const spriteData: SpriteData = {
			characterWidth: width,
			characterHeight: height,
			spriteAtlas: {
				image: {} as OffscreenCanvas,
				lookup: {},
				spriteIdentifiers: {
					fillColors: { background: 4, backgroundDots: 5, backgroundDots2: 6 },
				} as SpriteData['spriteAtlas']['spriteIdentifiers'],
			},
		};
		const composite = createBackgroundSprite(spriteData);
		expect(composite).toMatchObject({ id: 'web-ui:background', width: 64 * width, height: 32 * height });
		const target = { drawSprite: vi.fn() };
		const resolveSprite = vi.fn((identifier: SpriteIdentifier) => (Number(identifier) + 10) as SpriteId);
		composite.draw(target, { resolveSprite });
		expect(resolveSprite.mock.calls.map(call => call[0])).toEqual([4, 5, 6]);
		expect(target.drawSprite).toHaveBeenCalledTimes(1 + 64 * 32);
		const dotX = Math.floor((width - 2) / 2);
		const dotY = Math.floor((height - 2) / 2);
		expect(target.drawSprite.mock.calls.slice(0, 4)).toEqual([
			[0, 0, 14, width * 64, height * 32],
			[dotX, dotY, 16, 2, 2],
			[width + dotX, dotY, 15, 2, 2],
			[width * 2 + dotX, dotY, 16, 2, 2],
		]);
		expect(target.drawSprite.mock.calls[65]).toEqual([dotX, height + dotY, 16, 2, 2]);
		expect(target.drawSprite.mock.calls.at(-1)).toEqual([width * 63 + dotX, height * 31 + dotY, 15, 2, 2]);
	});
});
