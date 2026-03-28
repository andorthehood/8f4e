import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

export type ParsedNumericLiteralToken = {
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	isHex?: boolean;
};

export function startsWithNumericPrefix(argument: string): boolean {
	return /^-?(?:\d|\.\d)/.test(argument);
}

export function isNumericLikeInvalidToken(argument: string): boolean {
	return (
		startsWithNumericPrefix(argument) &&
		(/[*/]/.test(argument) ||
			argument.includes('.') ||
			/[eE]/.test(argument) ||
			/^-?0[xXbB]/.test(argument) ||
			/[fF]\d*$/.test(argument))
	);
}

export default function parseNumericLiteralToken(argument: string): ParsedNumericLiteralToken | null {
	if (/^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?\d+)?f64$/.test(argument)) {
		const value = parseFloat(argument.slice(0, -3));
		if (!Number.isFinite(value)) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_NUMERIC_LITERAL, `Invalid numeric literal: ${argument}`, {
				argument,
			});
		}
		return { value, isInteger: false, isFloat64: true };
	}

	if (/^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?\d+)?$/.test(argument)) {
		const value = parseFloat(argument);
		if (!Number.isFinite(value)) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_NUMERIC_LITERAL, `Invalid numeric literal: ${argument}`, {
				argument,
			});
		}
		return {
			value,
			isInteger: /^-?[0-9]+$/.test(argument),
		};
	}

	if (/^-?0x[0-9a-fA-F]+$/.test(argument)) {
		return {
			value: parseInt(argument.replace('0x', ''), 16),
			isInteger: true,
			isHex: true,
		};
	}

	if (/^-?0b[0-1]+$/.test(argument)) {
		return { value: parseInt(argument.replace('0b', ''), 2), isInteger: true };
	}

	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseNumericLiteralToken', () => {
		it('parses decimal integers and floats', () => {
			expect(parseNumericLiteralToken('42')).toEqual({ value: 42, isInteger: true });
			expect(parseNumericLiteralToken('3.14')).toEqual({ value: 3.14, isInteger: false });
		});

		it('parses scientific notation as float-typed syntax', () => {
			expect(parseNumericLiteralToken('1e3')).toEqual({ value: 1000, isInteger: false });
			expect(parseNumericLiteralToken('1e-3')).toEqual({ value: 0.001, isInteger: false });
		});

		it('parses hex and binary integers', () => {
			expect(parseNumericLiteralToken('0x10')).toEqual({ value: 16, isInteger: true, isHex: true });
			expect(parseNumericLiteralToken('0b101')).toEqual({ value: 5, isInteger: true });
		});

		it('parses f64-suffixed literals', () => {
			expect(parseNumericLiteralToken('3f64')).toEqual({ value: 3, isInteger: false, isFloat64: true });
			expect(parseNumericLiteralToken('1.5e10f64')).toEqual({
				value: 1.5e10,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('rejects non-finite numeric literals', () => {
			expect(() => parseNumericLiteralToken('1e309')).toThrow('Invalid numeric literal');
			expect(() => parseNumericLiteralToken('1e309f64')).toThrow('Invalid numeric literal');
		});

		it('returns null for non-literals', () => {
			expect(parseNumericLiteralToken('SIZE')).toBeNull();
			expect(parseNumericLiteralToken('2*3')).toBeNull();
		});
	});
}
