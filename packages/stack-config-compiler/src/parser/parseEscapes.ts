/**
 * Parses escape sequences in a string
 */
export default function parseEscapes(str: string): string {
	return str.replace(/\\(.)/g, (_, char) => {
		switch (char) {
			case 'n':
				return '\n';
			case 't':
				return '\t';
			case '"':
				return '"';
			case '\\':
				return '\\';
			default:
				return char;
		}
	});
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseEscapes', () => {
		it('should replace \\n with newline', () => {
			expect(parseEscapes('hello\\nworld')).toBe('hello\nworld');
		});

		it('should replace \\t with tab', () => {
			expect(parseEscapes('hello\\tworld')).toBe('hello\tworld');
		});

		it('should replace \\" with quote', () => {
			expect(parseEscapes('say \\"hello\\"')).toBe('say "hello"');
		});

		it('should replace \\\\ with backslash', () => {
			expect(parseEscapes('path\\\\to\\\\file')).toBe('path\\to\\file');
		});

		it('should pass through unknown escapes', () => {
			expect(parseEscapes('hello\\xworld')).toBe('helloxworld');
		});

		it('should handle empty string', () => {
			expect(parseEscapes('')).toBe('');
		});

		it('should handle string with no escapes', () => {
			expect(parseEscapes('hello world')).toBe('hello world');
		});
	});
}
