/**
 * Extracts the macro name and body content between defmacro and defmacroEnd markers.
 * Returns the macro name and the lines between the markers (exclusive).
 */
export default function extractMacroBody(code: string[]): { name: string; body: string[] } | null {
	let startIndex = -1;
	let endIndex = -1;
	let macroName = '';

	for (let i = 0; i < code.length; i++) {
		const defmacroMatch = /^\s*defmacro\s+(\w+)(\s|$)/.exec(code[i]);
		if (defmacroMatch) {
			startIndex = i;
			macroName = defmacroMatch[1];
		} else if (/^\s*defmacroEnd(\s|$)/.test(code[i])) {
			endIndex = i;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex || !macroName) {
		return null;
	}

	return {
		name: macroName,
		body: code.slice(startIndex + 1, endIndex),
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractMacroBody', () => {
		it('should extract the macro name and body between defmacro and defmacroEnd markers', () => {
			const code = ['defmacro myMacro', 'push 42', 'pop', 'defmacroEnd'];
			const result = extractMacroBody(code);
			expect(result).toEqual({
				name: 'myMacro',
				body: ['push 42', 'pop'],
			});
		});

		it('should handle empty body between markers', () => {
			const code = ['defmacro emptyMacro', 'defmacroEnd'];
			const result = extractMacroBody(code);
			expect(result).toEqual({
				name: 'emptyMacro',
				body: [],
			});
		});

		it('should handle leading whitespace on markers', () => {
			const code = ['  defmacro myMacro', 'push 42', '  defmacroEnd'];
			const result = extractMacroBody(code);
			expect(result).toEqual({
				name: 'myMacro',
				body: ['push 42'],
			});
		});

		it('should return null if no defmacro marker', () => {
			const code = ['push 42', 'defmacroEnd'];
			const result = extractMacroBody(code);
			expect(result).toBeNull();
		});

		it('should return null if no defmacroEnd marker', () => {
			const code = ['defmacro myMacro', 'push 42'];
			const result = extractMacroBody(code);
			expect(result).toBeNull();
		});

		it('should return null for empty code', () => {
			const code: string[] = [];
			const result = extractMacroBody(code);
			expect(result).toBeNull();
		});

		it('should return null if defmacro comes after defmacroEnd', () => {
			const code = ['defmacroEnd', 'push 42', 'defmacro myMacro'];
			const result = extractMacroBody(code);
			expect(result).toBeNull();
		});

		it('should return null if defmacro has no name', () => {
			const code = ['defmacro', 'push 42', 'defmacroEnd'];
			const result = extractMacroBody(code);
			expect(result).toBeNull();
		});
	});
}
