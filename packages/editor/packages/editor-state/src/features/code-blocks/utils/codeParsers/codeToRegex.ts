import lineToRegexString from './lineToRegexString';

/**
 * Builds a multiline regex that matches a code snippet described by template lines.
 * @param code - Template lines defining the structure and capture groups to match.
 * @returns Regular expression configured with global + multiline flags.
 */
export default function codeToRegex(code: string[]) {
	return new RegExp(
		code
			.map(line => {
				return lineToRegexString(line);
			})
			.join('\n'),
		'gm'
	);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('codeToRegex', () => {
		it('captures multiple lines ignoring additional whitespace', () => {
			const regex = codeToRegex(['push :index', 'push :key']);
			const match = regex.exec('push 1\n  push    2');
			expect(match?.groups).toEqual({ index: '1', key: '2' });
		});
	});
}
