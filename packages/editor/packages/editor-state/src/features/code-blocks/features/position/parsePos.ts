import parseLocalDirectives from '../local-directives/parseDirectives';

import type { ParsedDirective } from '../../../global-directives/types';

export interface PosParseResult {
	x: number;
	y: number;
}

/**
 * Parses ; @pos directive from code block lines.
 *
 * A code block position is defined by a line matching the pattern:
 * "; @pos <x> <y>"
 *
 * @param directives - Parsed directives to inspect for a single code block
 * @returns Object with x and y grid coordinates if a valid @pos directive is found, undefined otherwise
 *
 * Rules:
 * - x and y must be strict integers (negative values allowed)
 * - If multiple @pos lines exist, returns undefined (treated as invalid)
 * - Malformed values (non-integers, floats) return undefined
 *
 * @example
 * ```typescript
 * const code = [
 *   'module myModule',
 *   '; @pos 10 20',
 *   'output out 1',
 *   'moduleEnd'
 * ];
 * const result = parsePos(directives); // { x: 10, y: 20 }
 * ```
 */
export default function parsePos(directives: ParsedDirective[]): PosParseResult | undefined {
	let foundPos: PosParseResult | undefined = undefined;

	for (const directive of directives) {
		if (directive.name !== 'pos') {
			continue;
		}

		// If we already found a @pos directive, multiple exists - return undefined (invalid)
		if (foundPos !== undefined) {
			return undefined;
		}

		if (directive.args.length !== 2) {
			return undefined;
		}

		const [xToken, yToken] = directive.args;

		// Parse x and y as integers - must be strict integers (no floats)
		const x = parseInt(xToken, 10);
		const y = parseInt(yToken, 10);

		// Verify they are valid integers (not NaN) and that parsing didn't truncate a float
		if (isNaN(x) || isNaN(y) || xToken !== x.toString() || yToken !== y.toString()) {
			return undefined;
		}

		foundPos = { x, y };
	}

	return foundPos;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	function toDirectives(code: string[]): ParsedDirective[] {
		return parseLocalDirectives(code);
	}

	describe('parsePos', () => {
		it('parses valid @pos directive with positive integers', () => {
			const code = ['module test', '; @pos 10 20', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: 10, y: 20 });
		});

		it('parses valid @pos directive with negative integers', () => {
			const code = ['module test', '; @pos -5 -10', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: -5, y: -10 });
		});

		it('parses valid @pos directive with mixed sign integers', () => {
			const code = ['module test', '; @pos -5 10', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: -5, y: 10 });
		});

		it('parses @pos directive with zero coordinates', () => {
			const code = ['module test', '; @pos 0 0', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: 0, y: 0 });
		});

		it('returns undefined when no @pos directive exists', () => {
			const code = ['module test', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has no arguments', () => {
			const code = ['module test', '; @pos', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has only one argument', () => {
			const code = ['module test', '; @pos 10', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has more than two arguments', () => {
			const code = ['module test', '; @pos 10 20 30', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when x is not an integer', () => {
			const code = ['module test', '; @pos abc 20', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when y is not an integer', () => {
			const code = ['module test', '; @pos 10 abc', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when x is a float', () => {
			const code = ['module test', '; @pos 10.5 20', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when y is a float', () => {
			const code = ['module test', '; @pos 10 20.5', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when both are floats', () => {
			const code = ['module test', '; @pos 10.5 20.5', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('returns undefined when multiple @pos directives exist', () => {
			const code = ['module test', '; @pos 10 20', '; @pos 30 40', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toBeUndefined();
		});

		it('ignores other directives and only parses @pos', () => {
			const code = ['module test', '; @group myGroup', '; @pos 10 20', '; @favorite', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: 10, y: 20 });
		});

		it('handles @pos directive with extra whitespace', () => {
			const code = ['module test', ';   @pos   10   20  ', 'moduleEnd'];
			const result = parsePos(toDirectives(code));
			expect(result).toEqual({ x: 10, y: 20 });
		});
	});
}
