import { describe, expect, it } from 'vitest';
import { getOverlayDrawRect } from './wasmOverlayTexture';

describe('getOverlayDrawRect', () => {
	it('centers the texture at its source dimensions by default', () => {
		expect(getOverlayDrawRect(64, 32, 320, 180)).toEqual({
			x: 128,
			y: 74,
			width: 64,
			height: 32,
		});
	});

	it('applies magnification while keeping the texture centered', () => {
		expect(getOverlayDrawRect(64, 32, 320, 180, 2)).toEqual({
			x: 96,
			y: 58,
			width: 128,
			height: 64,
		});
	});

	it.each([
		['left', 48],
		['center', 128],
		['right', 208],
	] as const)('positions the texture in the %s section', (position, x) => {
		expect(getOverlayDrawRect(64, 32, 320, 180, 1, position)).toEqual({
			x,
			y: 74,
			width: 64,
			height: 32,
		});
	});
});
