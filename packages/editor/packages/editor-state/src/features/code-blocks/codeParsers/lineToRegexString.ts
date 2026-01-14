function escapeRegExp(text: string) {
	return text.replaceAll(/[[\]]/g, '\\$&');
}

/**
 * Converts a single line template into a whitespace-tolerant regex source string with named captures.
 * @param line - Template line that may include placeholders like :name.
 * @returns Regex source string for consumption by multiline matchers.
 */
export default function lineToRegexString(line: string) {
	return `\\s*${escapeRegExp(line)
		.replaceAll(' ', '\\s+')
		.replaceAll(/:([\d\w]+)/g, '(?<$1>\\S+)')}[^\\S\\n]*`;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('lineToRegexString', () => {
		it('produces a regex string that preserves variable captures', () => {
			expect(lineToRegexString('push :index')).toBe('\\s*push\\s+(?<index>\\S+)[^\\S\\n]*');
		});

		it('escapes square brackets', () => {
			expect(lineToRegexString('init buffer[1] :value')).toContain('buffer\\[1\\]');
		});
	});
}
