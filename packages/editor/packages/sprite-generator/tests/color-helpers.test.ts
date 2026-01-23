import { describe, it, expect } from 'vitest';

import { lighten, darken, alpha, mix } from '../src/color-helpers';

describe('color-helpers module', () => {
	describe('lighten function', () => {
		it('should lighten a hex color', () => {
			// #000000 (black) lightened by 50% should be #808080 (gray)
			expect(lighten('#000000', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should lighten a 3-digit hex color', () => {
			// #000 (black) lightened by 50% should be #808080 (gray)
			expect(lighten('#000', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should lighten an rgba color', () => {
			// rgba(0,0,0,1) lightened by 50% should be rgba(128,128,128,1)
			expect(lighten('rgba(0,0,0,1)', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should preserve alpha channel', () => {
			expect(lighten('rgba(0,0,0,0.5)', 0.5)).toBe('rgba(128,128,128,0.5)');
		});

		it('should clamp amount to 0-1 range', () => {
			// Amount > 1 should be clamped to 1 (white)
			expect(lighten('#000000', 2)).toBe('rgba(255,255,255,1)');
			// Amount < 0 should be clamped to 0 (no change)
			expect(lighten('#808080', -0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should handle already light colors', () => {
			// White lightened by any amount stays white
			expect(lighten('#ffffff', 0.5)).toBe('rgba(255,255,255,1)');
		});

		it('should handle partial lightening', () => {
			// #ff0000 (red) lightened by 0.5 should increase G and B by half of remaining to 255
			expect(lighten('#ff0000', 0.5)).toBe('rgba(255,128,128,1)');
		});
	});

	describe('darken function', () => {
		it('should darken a hex color', () => {
			// #ffffff (white) darkened by 50% should be #808080 (gray)
			expect(darken('#ffffff', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should darken a 3-digit hex color', () => {
			// #fff (white) darkened by 50% should be #808080 (gray)
			expect(darken('#fff', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should darken an rgba color', () => {
			// rgba(255,255,255,1) darkened by 50% should be rgba(128,128,128,1)
			expect(darken('rgba(255,255,255,1)', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should preserve alpha channel', () => {
			expect(darken('rgba(255,255,255,0.5)', 0.5)).toBe('rgba(128,128,128,0.5)');
		});

		it('should clamp amount to 0-1 range', () => {
			// Amount > 1 should be clamped to 1 (black)
			expect(darken('#ffffff', 2)).toBe('rgba(0,0,0,1)');
			// Amount < 0 should be clamped to 0 (no change)
			expect(darken('#808080', -0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should handle already dark colors', () => {
			// Black darkened by any amount stays black
			expect(darken('#000000', 0.5)).toBe('rgba(0,0,0,1)');
		});

		it('should handle partial darkening', () => {
			// #00ff00 (green) darkened by 0.5 should reduce G by half
			expect(darken('#00ff00', 0.5)).toBe('rgba(0,128,0,1)');
		});
	});

	describe('alpha function', () => {
		it('should set alpha on a hex color', () => {
			expect(alpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
		});

		it('should set alpha on a 3-digit hex color', () => {
			expect(alpha('#f00', 0.5)).toBe('rgba(255,0,0,0.5)');
		});

		it('should change alpha on an rgba color', () => {
			expect(alpha('rgba(255,0,0,1)', 0.5)).toBe('rgba(255,0,0,0.5)');
		});

		it('should clamp alpha to 0-1 range', () => {
			// Alpha > 1 should be clamped to 1
			expect(alpha('#ff0000', 2)).toBe('rgba(255,0,0,1)');
			// Alpha < 0 should be clamped to 0
			expect(alpha('#ff0000', -0.5)).toBe('rgba(255,0,0,0)');
		});

		it('should handle fully transparent', () => {
			expect(alpha('#ffffff', 0)).toBe('rgba(255,255,255,0)');
		});

		it('should handle fully opaque', () => {
			expect(alpha('rgba(128,128,128,0.5)', 1)).toBe('rgba(128,128,128,1)');
		});
	});

	describe('mix function', () => {
		it('should mix two hex colors at 50/50', () => {
			// Mix black and white should give gray
			expect(mix('#000000', '#ffffff', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should mix two 3-digit hex colors', () => {
			expect(mix('#000', '#fff', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should mix two rgba colors', () => {
			expect(mix('rgba(0,0,0,1)', 'rgba(255,255,255,1)', 0.5)).toBe('rgba(128,128,128,1)');
		});

		it('should default to 50/50 mix when weight not provided', () => {
			expect(mix('#000000', '#ffffff')).toBe('rgba(128,128,128,1)');
		});

		it('should mix with different weights', () => {
			// 75% black, 25% white
			expect(mix('#000000', '#ffffff', 0.75)).toBe('rgba(64,64,64,1)');
			// 25% black, 75% white
			expect(mix('#000000', '#ffffff', 0.25)).toBe('rgba(191,191,191,1)');
		});

		it('should handle weight of 0 (all second color)', () => {
			expect(mix('#000000', '#ffffff', 0)).toBe('rgba(255,255,255,1)');
		});

		it('should handle weight of 1 (all first color)', () => {
			expect(mix('#000000', '#ffffff', 1)).toBe('rgba(0,0,0,1)');
		});

		it('should clamp weight to 0-1 range', () => {
			// Weight > 1 should be clamped to 1
			expect(mix('#000000', '#ffffff', 2)).toBe('rgba(0,0,0,1)');
			// Weight < 0 should be clamped to 0
			expect(mix('#000000', '#ffffff', -0.5)).toBe('rgba(255,255,255,1)');
		});

		it('should mix colors with different alpha values', () => {
			expect(mix('rgba(0,0,0,1)', 'rgba(255,255,255,0)', 0.5)).toBe('rgba(128,128,128,0.5)');
		});

		it('should mix complementary colors', () => {
			// Red and cyan
			expect(mix('#ff0000', '#00ffff', 0.5)).toBe('rgba(128,128,128,1)');
		});
	});

	describe('hex parsing edge cases', () => {
		it('should parse various hex formats correctly', () => {
			// Test that different formats parse to same result
			const black3 = lighten('#000', 0);
			const black6 = lighten('#000000', 0);
			expect(black3).toBe(black6);

			const red3 = lighten('#f00', 0);
			const red6 = lighten('#ff0000', 0);
			expect(red3).toBe(red6);
		});

		it('should handle hex colors with whitespace', () => {
			expect(lighten(' #ffffff ', 0)).toBe('rgba(255,255,255,1)');
		});
	});

	describe('rgba parsing edge cases', () => {
		it('should parse rgba with spaces', () => {
			expect(lighten('rgba( 255 , 0 , 0 , 1 )', 0)).toBe('rgba(255,0,0,1)');
		});

		it('should parse rgba without alpha (defaults to 1)', () => {
			expect(lighten('rgba(255,0,0)', 0)).toBe('rgba(255,0,0,1)');
		});

		it('should parse rgb without alpha', () => {
			expect(lighten('rgb(255,0,0)', 0)).toBe('rgba(255,0,0,1)');
		});

		it('should handle decimal alpha values', () => {
			expect(alpha('rgba(255,0,0,0.75)', 1)).toBe('rgba(255,0,0,1)');
		});
	});

	describe('error handling', () => {
		it('should throw error for invalid hex format', () => {
			expect(() => lighten('#gg0000', 0.5)).toThrow('Invalid hex color format');
			expect(() => lighten('#12', 0.5)).toThrow('Invalid hex color format');
			expect(() => lighten('#1234567', 0.5)).toThrow('Invalid hex color format');
		});

		it('should throw error for invalid rgba format', () => {
			expect(() => lighten('rgba(255,0)', 0.5)).toThrow('Invalid color format');
			expect(() => lighten('rgb(255,0,0,1,2)', 0.5)).toThrow('Invalid color format');
		});

		it('should throw error for unknown format', () => {
			expect(() => lighten('not-a-color', 0.5)).toThrow('Invalid color format');
		});

		it('should throw error for RGB values outside 0-255 range', () => {
			expect(() => lighten('rgba(300,0,0,1)', 0.5)).toThrow('RGB values must be in the 0-255 range');
			expect(() => lighten('rgba(0,400,0,1)', 0.5)).toThrow('RGB values must be in the 0-255 range');
			expect(() => lighten('rgba(0,0,500,1)', 0.5)).toThrow('RGB values must be in the 0-255 range');
			expect(() => lighten('rgba(-10,0,0,1)', 0.5)).toThrow('RGB values must be in the 0-255 range');
		});

		it('should throw error for alpha values outside 0-1 range', () => {
			expect(() => alpha('rgba(255,0,0,2)', 0.5)).toThrow('Alpha value must be in the 0-1 range');
			expect(() => alpha('rgba(255,0,0,-0.5)', 0.5)).toThrow('Alpha value must be in the 0-1 range');
		});
	});

	describe('integration - real world color scheme scenarios', () => {
		it('should create a derived color scheme with variations', () => {
			const baseColor = '#00cc00';

			// Create variations of a base color for a scheme
			const light = lighten(baseColor, 0.3);
			const dark = darken(baseColor, 0.3);
			const transparent = alpha(baseColor, 0.7);
			const mixed = mix(baseColor, '#ffffff', 0.6);

			// Verify all results are in correct format
			expect(light).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
			expect(dark).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
			expect(transparent).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
			expect(mixed).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
		});

		it('should chain operations', () => {
			// Start with a base color, darken it, then make it transparent
			const base = '#ff0000';
			const darkened = darken(base, 0.5);
			const result = alpha(darkened, 0.5);

			expect(result).toBe('rgba(128,0,0,0.5)');
		});

		it('should create gradient-like color series', () => {
			const start = '#000000';
			const end = '#ffffff';

			const steps = [
				mix(start, end, 1.0),
				mix(start, end, 0.75),
				mix(start, end, 0.5),
				mix(start, end, 0.25),
				mix(start, end, 0.0),
			];

			// Verify gradient goes from black to white
			expect(steps[0]).toBe('rgba(0,0,0,1)');
			expect(steps[4]).toBe('rgba(255,255,255,1)');
			// Middle should be gray
			expect(steps[2]).toBe('rgba(128,128,128,1)');
		});
	});
});
