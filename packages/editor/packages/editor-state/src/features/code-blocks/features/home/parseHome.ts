/**
 * Parses ; @home directive from code block lines.
 *
 * A code block is marked as home if it contains a line matching the pattern:
 * "; @home"
 *
 * @param code - Array of code lines to parse
 * @returns true if a valid @home directive is found, false otherwise
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @home',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const result = parseHome(code); // true
 * ```
 */
export default function parseHome(code: string[]): boolean {
	for (const line of code) {
		// Match semicolon comment lines with @home directive
		const commentMatch = line.match(/^\s*;\s*@(\w+)(?:\s|$)/);
		if (commentMatch && commentMatch[1] === 'home') {
			return true;
		}
	}
	return false;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseHome', () => {
		it('returns true when @home directive exists', () => {
			const code = ['module test', '; @home', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});

		it('returns false when no @home directive exists', () => {
			const code = ['module test', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(false);
		});

		it('returns true when @home has extra whitespace', () => {
			const code = ['module test', ';   @home  ', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});

		it('returns false for plain comments without @ prefix', () => {
			const code = ['module test', '; home', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(false);
		});

		it('returns false for comments with home as part of text', () => {
			const code = ['module test', '; this is home by default', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(false);
		});

		it('ignores other directives and only checks for @home', () => {
			const code = ['module test', '; @group myGroup', '; @pos 10 20', '; @favorite', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(false);
		});

		it('returns true when @home is among other directives', () => {
			const code = ['module test', '; @group myGroup', '; @home', '; @pos 10 20', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});

		it('returns true if @home appears multiple times', () => {
			const code = ['module test', '; @home', '; @pos 10 20', '; @home', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});

		it('returns true for @home at the beginning of a block', () => {
			const code = ['; @home', 'module test', 'moduleEnd'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});

		it('returns true for @home at the end of a block', () => {
			const code = ['module test', 'moduleEnd', '; @home'];
			const result = parseHome(code);
			expect(result).toBe(true);
		});
	});
}
