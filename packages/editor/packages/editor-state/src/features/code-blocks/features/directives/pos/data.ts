import { parseBlockDirectives } from '../../../utils/parseBlockDirectives';

import type { ParsedDirectiveRecord } from '@8f4e/editor-state-types';
import type { EditorDirectivePlugin, ParsedEditorDirective } from '@8f4e/editor-state-types';

export interface PosParseResult {
	x: number;
	y: number;
}

function parseStrictInteger(value: string): number | undefined {
	const parsed = parseInt(value, 10);
	if (isNaN(parsed) || value !== parsed.toString()) {
		return undefined;
	}

	return parsed;
}

const posDirectivePlugin: EditorDirectivePlugin = {
	name: 'pos',
};

export function createPosDirectiveData(directive: ParsedEditorDirective): PosParseResult | undefined {
	if (directive.args.length !== 2) {
		return undefined;
	}

	const x = parseStrictInteger(directive.args[0]);
	const y = parseStrictInteger(directive.args[1]);
	if (x === undefined || y === undefined) {
		return undefined;
	}

	return { x, y };
}

/**
 * Parses ; @pos directive from code block lines.
 *
 * A code block position is defined by a line matching the pattern:
 * "; @pos <x> <y>"
 *
 * @param parsedDirectives - Parsed directive records for the code block
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
 * const result = parsePos(parseBlockDirectives(code)); // { x: 10, y: 20 }
 * ```
 */
export default function parsePos(parsedDirectives: ParsedDirectiveRecord[]): PosParseResult | undefined {
	const directives = parsedDirectives.filter(
		directive => directive.prefix === '@' && directive.name === posDirectivePlugin.name
	);
	if (directives.length !== 1) {
		return undefined;
	}

	return createPosDirectiveData(directives[0]);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parsePos', () => {
		function runParsePos(code: string[]) {
			return parsePos(parseBlockDirectives(code));
		}

		it('parses valid @pos directive with positive integers', () => {
			const code = ['module test', '; @pos 10 20', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: 10, y: 20 });
		});

		it('parses valid @pos directive with negative integers', () => {
			const code = ['module test', '; @pos -5 -10', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: -5, y: -10 });
		});

		it('parses valid @pos directive with mixed sign integers', () => {
			const code = ['module test', '; @pos -5 10', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: -5, y: 10 });
		});

		it('parses @pos directive with zero coordinates', () => {
			const code = ['module test', '; @pos 0 0', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: 0, y: 0 });
		});

		it('returns undefined when no @pos directive exists', () => {
			const code = ['module test', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has no arguments', () => {
			const code = ['module test', '; @pos', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has only one argument', () => {
			const code = ['module test', '; @pos 10', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when @pos has more than two arguments', () => {
			const code = ['module test', '; @pos 10 20 30', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when x is not an integer', () => {
			const code = ['module test', '; @pos abc 20', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when y is not an integer', () => {
			const code = ['module test', '; @pos 10 abc', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when x is a float', () => {
			const code = ['module test', '; @pos 10.5 20', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when y is a float', () => {
			const code = ['module test', '; @pos 10 20.5', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when both are floats', () => {
			const code = ['module test', '; @pos 10.5 20.5', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('returns undefined when multiple @pos directives exist', () => {
			const code = ['module test', '; @pos 10 20', '; @pos 30 40', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toBeUndefined();
		});

		it('ignores other directives and only parses @pos', () => {
			const code = ['module test', '; @group myGroup', '; @pos 10 20', '; @favorite', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: 10, y: 20 });
		});

		it('handles @pos directive with extra whitespace', () => {
			const code = ['module test', ';   @pos   10   20  ', 'moduleEnd'];
			const result = runParsePos(code);
			expect(result).toEqual({ x: 10, y: 20 });
		});
	});
}
