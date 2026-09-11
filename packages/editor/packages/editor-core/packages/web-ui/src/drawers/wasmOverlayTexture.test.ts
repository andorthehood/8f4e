import { describe, expect, it } from 'vitest';
import { getCenteredDrawRect } from './wasmOverlayTexture';

describe('getCenteredDrawRect', () => {
	it('centers the texture at its source dimensions by default', () => {
		expect(getCenteredDrawRect(64, 32, 320, 180)).toEqual({
			x: 128,
			y: 74,
			width: 64,
			height: 32,
		});
	});

	it('applies magnification while keeping the texture centered', () => {
		expect(getCenteredDrawRect(64, 32, 320, 180, 2)).toEqual({
			x: 96,
			y: 58,
			width: 128,
			height: 64,
		});
	});
});
