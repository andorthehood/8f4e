import { describe, expect, it } from 'vitest';

import { normalizeSpriteIdentifier, prepareSpriteAtlas } from './spriteAtlas.ts';

describe('prepareSpriteAtlas', () => {
	it('assigns dense ids and encodes source rectangles', () => {
		const prepared = prepareSpriteAtlas(
			{
				player: { x: 1, y: 2, spriteWidth: 8, spriteHeight: 16 },
				enemy: { x: 20, y: 4, spriteWidth: 12, spriteHeight: 10 },
			},
			64,
			64
		);

		expect(Array.from(prepared.metadata)).toEqual([1, 2, 8, 16, 20, 4, 12, 10]);
		expect(prepared.sprites.get('player')).toEqual({ x: 1, y: 2, spriteWidth: 8, spriteHeight: 16, id: 0 });
		expect(prepared.sprites.get('enemy')?.id).toBe(1);
	});

	it('normalizes public numeric and string ids to the same lookup key', () => {
		expect(normalizeSpriteIdentifier(42)).toBe('42');
		expect(normalizeSpriteIdentifier('42')).toBe('42');
		const prepared = prepareSpriteAtlas({ 42: { x: 0, y: 0, spriteWidth: 1, spriteHeight: 1 } }, 1, 1);
		expect(prepared.sprites.get(normalizeSpriteIdentifier(42))?.id).toBe(0);
	});

	it('rejects empty, invalid, or out-of-bounds lookup entries', () => {
		expect(() => prepareSpriteAtlas({}, 16, 16)).toThrow('at least one sprite');
		expect(() => prepareSpriteAtlas({ bad: { x: 0.5, y: 0, spriteWidth: 1, spriteHeight: 1 } }, 16, 16)).toThrow(
			'expected a uint16 value'
		);
		expect(() => prepareSpriteAtlas({ bad: { x: 15, y: 0, spriteWidth: 2, spriteHeight: 1 } }, 16, 16)).toThrow(
			'extends outside the atlas'
		);
	});
});
