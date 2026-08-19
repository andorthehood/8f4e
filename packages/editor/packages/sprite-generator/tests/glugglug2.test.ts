import type { SpriteCoordinates, SpriteLookup } from 'glugglug2';
import { describe, expect, it } from 'vitest';

import { createGlugglug2Atlas } from '../src/index.ts';

describe('glugglug2 atlas output', () => {
	it('flattens semantic groups into dense numeric sprite ids', () => {
		const image = {} as OffscreenCanvas;
		const red: SpriteCoordinates = { x: 0, y: 0, spriteWidth: 8, spriteHeight: 8 };
		const green: SpriteCoordinates = { x: 8, y: 0, spriteWidth: 8, spriteHeight: 8 };
		const atlas = createGlugglug2Atlas(image, {
			fontCode: { 65: red, A: red },
			fillColors: { foreground: red, background: green },
		});

		const compatibleLookup: SpriteLookup = atlas.lookup;
		expect(atlas.image).toBe(image);
		expect(compatibleLookup).toEqual({
			0: red,
			1: green,
		});
		expect(atlas.spriteIds).toEqual({
			fontCode: { 65: 0, A: 0 },
			fillColors: { foreground: 0, background: 1 },
		});
	});

	it('copies coordinates into a deterministic lookup without mutating the grouped input', () => {
		const image = {} as OffscreenCanvas;
		const coordinates: SpriteCoordinates = { x: 3, y: 5, spriteWidth: 7, spriteHeight: 11 };
		const groupedLookups = { icons: { play: coordinates } };
		const first = createGlugglug2Atlas(image, groupedLookups);
		const second = createGlugglug2Atlas(image, groupedLookups);

		expect(second).toEqual(first);
		expect(first.lookup[0]).not.toBe(coordinates);
		expect(groupedLookups).toEqual({ icons: { play: coordinates } });
	});
});
