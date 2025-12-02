/**
 * Extracts the body content between config and configEnd markers.
 * Returns the lines between the markers (exclusive).
 */
export function extractConfigBody(code: string[]): string[] {
	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		if (/^\s*config(\s|$)/.test(code[i])) {
			startIndex = i;
		} else if (/^\s*configEnd(\s|$)/.test(code[i])) {
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
		it('should extract the body between config and configEnd markers', () => {
			const code = ['config', 'push 42', 'set', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42', 'set']);
		});

		it('should handle empty body between markers', () => {
			const code = ['config', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should handle leading whitespace on markers', () => {
			const code = ['  config', 'push 42', '  configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42']);
		});

		it('should return empty array if no config marker', () => {
			const code = ['push 42', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if no configEnd marker', () => {
			const code = ['config', 'push 42'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array for empty code', () => {
			const code: string[] = [];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if config comes after configEnd', () => {
			const code = ['configEnd', 'push 42', 'config'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});
	});
}
