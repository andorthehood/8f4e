import parseEscapes from './parseEscapes';

import type { Literal } from '../types';

/** Regex to match string literals with escape sequences */
const STRING_LITERAL_REGEX = /^"((?:[^"\\]|\\.)*)"/;

/** Regex to match fraction literals (e.g., 1/16, -8/2) */
const FRACTION_LITERAL_REGEX = /^(-?\d+)\/(-?\d+)$/;

/** Regex to match strict numeric literals (e.g., 42, -10, 3.14) */
const NUMERIC_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

/**
 * Parses a literal value (string, number, boolean, null)
 */
export default function parseLiteral(token: string): Literal | { error: string } {
	const stringMatch = token.match(STRING_LITERAL_REGEX);
	if (stringMatch) {
		return parseEscapes(stringMatch[1]);
	}

	if (token.startsWith('"')) {
		return { error: `Invalid string literal: ${token}` };
	}

	if (token === 'true') return true;
	if (token === 'false') return false;

	if (token === 'null') return null;

	// Check for fraction literal (e.g., 1/16)
	const fractionMatch = token.match(FRACTION_LITERAL_REGEX);
	if (fractionMatch) {
		const numerator = parseInt(fractionMatch[1], 10);
		const denominator = parseInt(fractionMatch[2], 10);
		if (denominator === 0) {
			return { error: `Division by zero in fraction: ${token}` };
		}
		return numerator / denominator;
	}

	// Strict numeric parsing (no partial parsing like parseFloat does)
	if (NUMERIC_LITERAL_REGEX.test(token)) {
		return parseFloat(token);
	}

	return { error: `Invalid literal: ${token}` };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseLiteral', () => {
		it('should parse string literal', () => {
			expect(parseLiteral('"hello"')).toBe('hello');
		});

		it('should parse string with escapes', () => {
			expect(parseLiteral('"hello\\nworld"')).toBe('hello\nworld');
		});

		it('should return error for unclosed string', () => {
			expect(parseLiteral('"unclosed')).toEqual({ error: 'Invalid string literal: "unclosed' });
		});

		it('should parse true', () => {
			expect(parseLiteral('true')).toBe(true);
		});

		it('should parse false', () => {
			expect(parseLiteral('false')).toBe(false);
		});

		it('should parse null', () => {
			expect(parseLiteral('null')).toBe(null);
		});

		it('should parse integer', () => {
			expect(parseLiteral('42')).toBe(42);
		});

		it('should parse float', () => {
			expect(parseLiteral('3.14')).toBe(3.14);
		});

		it('should parse negative number', () => {
			expect(parseLiteral('-10')).toBe(-10);
		});

		it('should return error for invalid literal', () => {
			expect(parseLiteral('invalid')).toEqual({ error: 'Invalid literal: invalid' });
		});

		it('should parse fraction literal 1/16', () => {
			expect(parseLiteral('1/16')).toBe(0.0625);
		});

		it('should parse fraction literal 8/2', () => {
			expect(parseLiteral('8/2')).toBe(4);
		});

		it('should parse negative numerator fraction', () => {
			expect(parseLiteral('-1/2')).toBe(-0.5);
		});

		it('should parse negative denominator fraction', () => {
			expect(parseLiteral('1/-2')).toBe(-0.5);
		});

		it('should parse both negative fraction', () => {
			expect(parseLiteral('-8/-2')).toBe(4);
		});

		it('should return error for division by zero', () => {
			expect(parseLiteral('8/0')).toEqual({ error: 'Division by zero in fraction: 8/0' });
		});

		it('should return error for invalid numeric with suffix', () => {
			expect(parseLiteral('123abc')).toEqual({ error: 'Invalid literal: 123abc' });
		});

		it('should return error for invalid numeric with prefix', () => {
			expect(parseLiteral('abc123')).toEqual({ error: 'Invalid literal: abc123' });
		});

		it('should return error for fraction with whitespace', () => {
			expect(parseLiteral('1 / 2')).toEqual({ error: 'Invalid literal: 1 / 2' });
		});
	});
}
