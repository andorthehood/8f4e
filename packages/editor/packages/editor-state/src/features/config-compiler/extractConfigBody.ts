/**
 * Extracts the body content between projectConfig and projectConfigEnd markers.
 * Returns the lines between the markers (exclusive).
 */
export default function extractConfigBody(code: string[]): string[] {
	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		if (/^\s*projectConfig(\s|$)/.test(code[i])) {
			startIndex = i;
		} else if (/^\s*projectConfigEnd(\s|$)/.test(code[i])) {
			endIndex = i;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return [];
	}

	return code.slice(startIndex + 1, endIndex);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractConfigBody', () => {
		it('should extract the body between projectConfig and projectConfigEnd markers', () => {
			const code = ['projectConfig', 'push 42', 'set', 'projectConfigEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42', 'set']);
		});

		it('should handle empty body between markers', () => {
			const code = ['projectConfig', 'projectConfigEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should handle leading whitespace on markers', () => {
			const code = ['  projectConfig', 'push 42', '  projectConfigEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42']);
		});

		it('should return empty array if no projectConfig marker', () => {
			const code = ['push 42', 'projectConfigEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if no projectConfigEnd marker', () => {
			const code = ['projectConfig', 'push 42'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array for empty code', () => {
			const code: string[] = [];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if projectConfig comes after projectConfigEnd', () => {
			const code = ['projectConfigEnd', 'push 42', 'projectConfig'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});
	});
}
