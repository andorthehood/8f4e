/**
 * Extracts the config type from the config marker line.
 * Returns null if no config marker is found or if it doesn't have a type.
 */
export function extractConfigType(code: string[]): string | null {
	for (const line of code) {
		const match = /^\s*config\s+(\S+)/.exec(line);
		if (match) {
			return match[1];
		}
	}
	return null;
}

/**
 * Extracts the body content between config <type> and configEnd markers.
 * Returns the lines between the markers (exclusive).
 */
export default function extractConfigBody(code: string[]): string[] {
	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		if (/^\s*config\s+\S+/.test(code[i])) {
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

	describe('extractConfigType', () => {
		it('should extract config type from config marker', () => {
			const code = ['config project', 'push 42', 'configEnd'];
			const type = extractConfigType(code);
			expect(type).toBe('project');
		});

		it('should return null if no config marker', () => {
			const code = ['push 42', 'configEnd'];
			const type = extractConfigType(code);
			expect(type).toBe(null);
		});

		it('should return null if config has no type', () => {
			const code = ['config', 'push 42', 'configEnd'];
			const type = extractConfigType(code);
			expect(type).toBe(null);
		});

		it('should handle leading whitespace', () => {
			const code = ['  config project', 'push 42', 'configEnd'];
			const type = extractConfigType(code);
			expect(type).toBe('project');
		});

		it('should extract first occurrence if multiple config markers', () => {
			const code = ['config project', 'config editor', 'configEnd'];
			const type = extractConfigType(code);
			expect(type).toBe('project');
		});
	});

	describe('extractConfigBody', () => {
		it('should extract the body between config <type> and configEnd markers', () => {
			const code = ['config project', 'push 42', 'set', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42', 'set']);
		});

		it('should handle empty body between markers', () => {
			const code = ['config project', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should handle leading whitespace on markers', () => {
			const code = ['  config project', 'push 42', '  configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42']);
		});

		it('should return empty array if no config marker', () => {
			const code = ['push 42', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if no configEnd marker', () => {
			const code = ['config project', 'push 42'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array for empty code', () => {
			const code: string[] = [];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if config comes after configEnd', () => {
			const code = ['configEnd', 'push 42', 'config project'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if config has no type', () => {
			const code = ['config', 'push 42', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});
	});
}
