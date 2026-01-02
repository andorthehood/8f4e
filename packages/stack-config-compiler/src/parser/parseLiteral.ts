import parseEscapes from './parseEscapes';

import type { Literal } from '../types';

/** Regex to match string literals with escape sequences */
const STRING_LITERAL_REGEX = /^"((?:[^"\\]|\\.)*)"/;

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

	const num = parseFloat(token);
	if (!isNaN(num)) return num;

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
	});
}
