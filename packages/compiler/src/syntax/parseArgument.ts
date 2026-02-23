import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

export enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
	STRING_LITERAL = 'string_literal',
}

export type ArgumentLiteral = { type: ArgumentType.LITERAL; value: number; isInteger: boolean; isFloat64?: boolean };
export type ArgumentIdentifier = { type: ArgumentType.IDENTIFIER; value: string };
export type ArgumentStringLiteral = { type: ArgumentType.STRING_LITERAL; value: string };

export type Argument = ArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral;

/**
 * Decodes escape sequences in a raw (unquoted) string literal body.
 * Supported: \", \\, \n, \r, \t, \xNN.
 */
export function decodeStringLiteral(raw: string): string {
	let result = '';
	let i = 0;
	while (i < raw.length) {
		if (raw[i] === '\\') {
			if (i + 1 >= raw.length) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, `Unexpected end of string after backslash`, {
					raw,
				});
			}
			const next = raw[i + 1];
			switch (next) {
				case '"':
					result += '"';
					i += 2;
					break;
				case '\\':
					result += '\\';
					i += 2;
					break;
				case 'n':
					result += '\n';
					i += 2;
					break;
				case 'r':
					result += '\r';
					i += 2;
					break;
				case 't':
					result += '\t';
					i += 2;
					break;
				case 'x': {
					const hex = raw.slice(i + 2, i + 4);
					if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
						throw new SyntaxRulesError(
							SyntaxErrorCode.INVALID_STRING_LITERAL,
							`Invalid hex escape sequence: \\x${hex}`,
							{ raw, hex }
						);
					}
					result += String.fromCharCode(parseInt(hex, 16));
					i += 4;
					break;
				}
				default:
					throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, `Unknown escape sequence: \\${next}`, {
						raw,
						escape: next,
					});
			}
		} else {
			result += raw[i];
			i++;
		}
	}
	return result;
}

/**
 * Parses a single argument from an instruction line.
 * Recognizes numeric literals (decimal, hex, binary, fractions), quoted string literals, and identifiers.
 * @param argument - The argument string to parse.
 * @returns Parsed argument with type information.
 */
export function parseArgument(argument: string): Argument {
	switch (true) {
		// Check for quoted string literals
		case argument.startsWith('"') && argument.endsWith('"') && argument.length >= 2: {
			const raw = argument.slice(1, -1);
			return { type: ArgumentType.STRING_LITERAL, value: decodeStringLiteral(raw) };
		}
		case /^-?\d+\/\d+$/.test(argument): {
			const [numeratorStr, denominatorStr] = argument.split('/');
			const numerator = parseInt(numeratorStr, 10);
			const denominator = parseInt(denominatorStr, 10);

			if (denominator === 0) {
				throw new SyntaxRulesError(
					SyntaxErrorCode.DIVISION_BY_ZERO,
					`Division by zero in fraction literal: ${argument}`,
					{ argument }
				);
			}

			const value = numerator / denominator;
			return {
				value,
				type: ArgumentType.LITERAL,
				isInteger: Number.isInteger(value),
			};
		}
		case /^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?\d+)?f64$/.test(argument): {
			const numStr = argument.slice(0, -3);
			return { value: parseFloat(numStr), type: ArgumentType.LITERAL, isInteger: false, isFloat64: true };
		}
		case /^-?[0-9.]+$/.test(argument):
			return { value: parseFloat(argument), type: ArgumentType.LITERAL, isInteger: /^-?[0-9]+$/.test(argument) };
		case /^-?0x[0-9a-fA-F]+$/.test(argument):
			return { value: parseInt(argument.replace('0x', ''), 16), type: ArgumentType.LITERAL, isInteger: true };
		case /^-?0b[0-1]+$/.test(argument):
			return { value: parseInt(argument.replace('0b', ''), 2), type: ArgumentType.LITERAL, isInteger: true };
		default:
			return { value: argument, type: ArgumentType.IDENTIFIER };
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseArgument', () => {
		it('parses decimal integers', () => {
			expect(parseArgument('42')).toEqual({ value: 42, type: ArgumentType.LITERAL, isInteger: true });
			expect(parseArgument('-7')).toEqual({ value: -7, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses decimal floats', () => {
			expect(parseArgument('3.14')).toEqual({ value: 3.14, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('parses hex integers', () => {
			expect(parseArgument('0x10')).toEqual({ value: 16, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses binary integers', () => {
			expect(parseArgument('0b101')).toEqual({ value: 5, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses identifiers', () => {
			expect(parseArgument('value')).toEqual({ value: 'value', type: ArgumentType.IDENTIFIER });
		});

		it('parses fraction literals with float result', () => {
			expect(parseArgument('1/16')).toEqual({ value: 0.0625, type: ArgumentType.LITERAL, isInteger: false });
			expect(parseArgument('-1/2')).toEqual({ value: -0.5, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('parses fraction literals with integer result', () => {
			expect(parseArgument('8/2')).toEqual({ value: 4, type: ArgumentType.LITERAL, isInteger: true });
			expect(parseArgument('16/4')).toEqual({ value: 4, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('throws error on division by zero in fraction literals', () => {
			expect(() => parseArgument('8/0')).toThrow('Division by zero');
			expect(() => parseArgument('1/0')).toThrow('Division by zero');
		});

		it('does not parse negative denominators as fractions', () => {
			// These should be parsed as identifiers, not fractions
			const result = parseArgument('1/-2');
			expect(result.type).toBe(ArgumentType.IDENTIFIER);
		});

		it('parses f64-suffixed float literals', () => {
			expect(parseArgument('3.14f64')).toEqual({
				value: 3.14,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
			expect(parseArgument('-42.0f64')).toEqual({
				value: -42.0,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
			expect(parseArgument('0.5f64')).toEqual({
				value: 0.5,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('parses f64-suffixed integer-valued literals as float64', () => {
			expect(parseArgument('3f64')).toEqual({
				value: 3,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('parses f64-suffixed scientific notation literals', () => {
			expect(parseArgument('1e-10f64')).toEqual({
				value: 1e-10,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
			expect(parseArgument('1.5e10f64')).toEqual({
				value: 1.5e10,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('does not parse malformed f64 suffix forms as f64 literals', () => {
			// F64 (uppercase) is not valid
			expect(parseArgument('3.14F64').type).toBe(ArgumentType.IDENTIFIER);
			// double-f is not valid
			expect(parseArgument('3.14ff64').type).toBe(ArgumentType.IDENTIFIER);
			// multiple dots are not valid
			expect(parseArgument('..f64').type).toBe(ArgumentType.IDENTIFIER);
		});

		describe('string literals', () => {
			it('parses a simple quoted string', () => {
				expect(parseArgument('"hello"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'hello' });
			});

			it('parses an empty string', () => {
				expect(parseArgument('""')).toEqual({ type: ArgumentType.STRING_LITERAL, value: '' });
			});

			it('decodes \\n escape', () => {
				expect(parseArgument('"a\\nb"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'a\nb' });
			});

			it('decodes \\r escape', () => {
				expect(parseArgument('"a\\rb"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'a\rb' });
			});

			it('decodes \\t escape', () => {
				expect(parseArgument('"a\\tb"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'a\tb' });
			});

			it('decodes \\\\ escape', () => {
				expect(parseArgument('"a\\\\b"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'a\\b' });
			});

			it('decodes \\" escape', () => {
				expect(parseArgument('"say \\"hi\\""')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'say "hi"' });
			});

			it('decodes \\xNN hex escape', () => {
				expect(parseArgument('"\\x41"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'A' });
				expect(parseArgument('"\\x00"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: '\x00' });
				expect(parseArgument('"\\xFF"')).toEqual({ type: ArgumentType.STRING_LITERAL, value: '\xFF' });
			});

			it('throws on malformed \\x escape', () => {
				expect(() => parseArgument('"\\xGG"')).toThrow('Invalid hex escape sequence');
				expect(() => parseArgument('"\\x1"')).toThrow('Invalid hex escape sequence');
			});

			it('throws on unknown escape sequence', () => {
				expect(() => parseArgument('"\\z"')).toThrow('Unknown escape sequence');
			});

			it('throws on trailing backslash', () => {
				expect(() => decodeStringLiteral('abc\\')).toThrow('Unexpected end of string');
			});
		});
	});
}
