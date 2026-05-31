import { describe, expect, it } from 'vitest';
import { getObjectFitDrawRect } from './wasmFrameTexture';

describe('getObjectFitDrawRect', () => {
	it('stretches to the viewport for fill', () => {
		expect(getObjectFitDrawRect('fill', 64, 64, 320, 180)).toEqual({
			x: 0,
			y: 0,
			width: 320,
			height: 180,
		});
	});

	it('preserves aspect ratio and crops for cover', () => {
		expect(getObjectFitDrawRect('cover', 64, 64, 320, 180)).toEqual({
			x: 0,
			y: -70,
			width: 320,
			height: 320,
		});
	});

	it('preserves aspect ratio and letterboxes for contain', () => {
		expect(getObjectFitDrawRect('contain', 64, 64, 320, 180)).toEqual({
			x: 70,
			y: 0,
			width: 180,
			height: 180,
		});
	});

	it('renders at the source size for none', () => {
		expect(getObjectFitDrawRect('none', 64, 32, 320, 180)).toEqual({
			x: 128,
			y: 74,
			width: 64,
			height: 32,
		});
	});
});
