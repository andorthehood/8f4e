import ascii6x10Old from '../src/fonts/6x10/ascii-old';
import ascii6x10New from '../src/fonts/6x10/ascii';
import glyphs6x10Old from '../src/fonts/6x10/glyphs-old';
import glyphs6x10New from '../src/fonts/6x10/glyphs';

describe('Font migration regression tests', () => {
	describe('6x10 ascii font', () => {
		it('should produce identical bitmap output after ASCII art migration for chars 0-126', () => {
			// The old font only had 127 characters (0-126), missing character 127 (DEL)
			// The new font correctly includes all 128 characters
			const oldLength = ascii6x10Old.length;
			const newSlice = ascii6x10New.slice(0, oldLength);
			expect(newSlice).toEqual(ascii6x10Old);
		});

		it('should have correct length (128 characters)', () => {
			expect(ascii6x10New.length).toBe(128 * 10); // 128 characters, 10 rows each
			// Old font was missing character 127
			expect(ascii6x10Old.length).toBe(127 * 10);
		});

		it('should have same values for printable characters', () => {
			// Check a sample of printable characters
			const printableChars = [' ', '!', 'A', 'Z', 'a', 'z', '0', '9'];
			printableChars.forEach(char => {
				const charCode = char.charCodeAt(0);
				const start = charCode * 10;
				const oldSlice = ascii6x10Old.slice(start, start + 10);
				const newSlice = ascii6x10New.slice(start, start + 10);
				expect(newSlice).toEqual(oldSlice);
			});
		});
	});

	describe('6x10 glyphs font', () => {
		it('should produce identical bitmap output after ASCII art migration', () => {
			expect(glyphs6x10New).toEqual(glyphs6x10Old);
		});

		it('should have correct length', () => {
			expect(glyphs6x10New.length).toBe(glyphs6x10Old.length);
		});
	});
});
