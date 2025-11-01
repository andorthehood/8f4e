import { asciiToBitmap, asciiGlyphsToFont } from '../src/fonts/ascii-converter';

describe('ascii-converter', () => {
	describe('asciiToBitmap', () => {
		it('should convert simple ASCII glyph to bitmap', () => {
			const glyph = ['   #  ', '  ### ', ' #   #'];
			const bitmap = asciiToBitmap(glyph, 6);

			expect(bitmap).toEqual([0b000100, 0b001110, 0b010001]);
		});

		it('should handle all pixels set', () => {
			const glyph = ['######', '######', '######'];
			const bitmap = asciiToBitmap(glyph, 6);

			expect(bitmap).toEqual([0b111111, 0b111111, 0b111111]);
		});

		it('should handle no pixels set', () => {
			const glyph = ['      ', '      ', '      '];
			const bitmap = asciiToBitmap(glyph, 6);

			expect(bitmap).toEqual([0b000000, 0b000000, 0b000000]);
		});

		it('should handle 8-bit width characters', () => {
			const glyph = ['   #    ', '  ###   ', ' ## ##  '];
			const bitmap = asciiToBitmap(glyph, 8);

			expect(bitmap).toEqual([0b00010000, 0b00111000, 0b01101100]);
		});

		it('should handle single pixel', () => {
			const glyph = ['#'];
			const bitmap = asciiToBitmap(glyph, 1);

			expect(bitmap).toEqual([0b1]);
		});

		it('should handle rows shorter than character width', () => {
			const glyph = ['#', '##', '###'];
			const bitmap = asciiToBitmap(glyph, 6);

			// Should pad with spaces (zeros) on the right
			expect(bitmap).toEqual([0b100000, 0b110000, 0b111000]);
		});

		it('should handle empty rows', () => {
			const glyph = ['', '', ''];
			const bitmap = asciiToBitmap(glyph, 6);

			expect(bitmap).toEqual([0b000000, 0b000000, 0b000000]);
		});

		it('should convert character "!" correctly', () => {
			// Character ! from 6x10 font
			const glyph = [
				'      ',
				'   #  ',
				'   #  ',
				'   #  ',
				'   #  ',
				'   #  ',
				'   #  ',
				'      ',
				'   #  ',
				'      ',
			];
			const bitmap = asciiToBitmap(glyph, 6);

			expect(bitmap).toEqual([
				0b000000, 0b000100, 0b000100, 0b000100, 0b000100, 0b000100, 0b000100, 0b000000, 0b000100, 0b000000,
			]);
		});

		it('should handle character "A" from 8x16 font', () => {
			const glyph = [
				'        ',
				'        ',
				'        ',
				'   #    ',
				'  ###   ',
				' ## ##  ',
				'##   ## ',
				'##   ## ',
				'##   ## ',
				'####### ',
				'##   ## ',
				'##   ## ',
				'##   ## ',
				'        ',
				'        ',
				'        ',
			];
			const bitmap = asciiToBitmap(glyph, 8);

			expect(bitmap).toEqual([
				0b00000000, 0b00000000, 0b00000000, 0b00010000, 0b00111000, 0b01101100, 0b11000110, 0b11000110, 0b11000110,
				0b11111110, 0b11000110, 0b11000110, 0b11000110, 0b00000000, 0b00000000, 0b00000000,
			]);
		});
	});

	describe('asciiGlyphsToFont', () => {
		it('should convert multiple glyphs to flat font array', () => {
			const glyphs = [
				['   #  ', '  ### '], // First character
				[' #   #', '######'], // Second character
			];
			const font = asciiGlyphsToFont(glyphs, 6);

			expect(font).toEqual([
				0b000100,
				0b001110, // First character
				0b010001,
				0b111111, // Second character
			]);
		});

		it('should handle single glyph', () => {
			const glyphs = [['   #  ', '  ### ', ' #   #']];
			const font = asciiGlyphsToFont(glyphs, 6);

			expect(font).toEqual([0b000100, 0b001110, 0b010001]);
		});

		it('should handle empty glyphs array', () => {
			const glyphs: string[][] = [];
			const font = asciiGlyphsToFont(glyphs, 6);

			expect(font).toEqual([]);
		});

		it('should produce correct length for 128 characters at 10 rows each', () => {
			// Create 128 blank 10-row glyphs (like 6x10 font)
			const glyphs = Array(128)
				.fill(null)
				.map(() => Array(10).fill('      '));
			const font = asciiGlyphsToFont(glyphs, 6);

			expect(font.length).toBe(128 * 10);
		});

		it('should produce correct length for 128 characters at 16 rows each', () => {
			// Create 128 blank 16-row glyphs (like 8x16 font)
			const glyphs = Array(128)
				.fill(null)
				.map(() => Array(16).fill('        '));
			const font = asciiGlyphsToFont(glyphs, 8);

			expect(font.length).toBe(128 * 16);
		});
	});
});
