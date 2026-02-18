/**
 * Parses ; @disabled directive from code block lines.
 *
 * A code block is disabled if it contains a line matching the pattern:
 * "; @disabled"
 *
 * @param code - Array of code lines to parse
 * @returns true if a valid @disabled directive is found, false otherwise
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @disabled',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const result = parseDisabled(code); // true
 * ```
 */
export default function parseDisabled(code: string[]): boolean {
	for (const line of code) {
		// Match semicolon comment lines with @disabled directive
		const commentMatch = line.match(/^\s*;\s*@(\w+)(?:\s|$)/);
		if (commentMatch && commentMatch[1] === 'disabled') {
			return true;
		}
	}
	return false;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseDisabled', () => {
		it('returns true when @disabled directive exists', () => {
			const code = ['module test', '; @disabled', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});

		it('returns false when no @disabled directive exists', () => {
			const code = ['module test', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(false);
		});

		it('returns true when @disabled has extra whitespace', () => {
			const code = ['module test', ';   @disabled  ', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});

		it('returns false for plain comments without @ prefix', () => {
			const code = ['module test', '; disabled', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(false);
		});

		it('returns false for comments with disabled as part of text', () => {
			const code = ['module test', '; this is disabled by default', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(false);
		});

		it('ignores other directives and only checks for @disabled', () => {
			const code = ['module test', '; @group myGroup', '; @pos 10 20', '; @favorite', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(false);
		});

		it('returns true when @disabled is among other directives', () => {
			const code = ['module test', '; @group myGroup', '; @disabled', '; @pos 10 20', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});

		it('returns true if @disabled appears multiple times', () => {
			const code = ['module test', '; @disabled', '; @pos 10 20', '; @disabled', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});

		it('returns true for @disabled at the beginning of a block', () => {
			const code = ['; @disabled', 'module test', 'moduleEnd'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});

		it('returns true for @disabled at the end of a block', () => {
			const code = ['module test', 'moduleEnd', '; @disabled'];
			const result = parseDisabled(code);
			expect(result).toBe(true);
		});
	});
}
