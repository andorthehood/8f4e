import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';
import parseLiteralMulDivExpression from './parseLiteralMulDivExpression';
import parseNumericLiteralToken, {
	isNumericLikeInvalidToken,
	startsWithNumericPrefix,
} from './parseNumericLiteralToken';
import parseConstantMulDivExpression from './parseConstantMulDivExpression';

export enum ArgumentType {
	LITERAL = 'literal',
	IDENTIFIER = 'identifier',
	STRING_LITERAL = 'string_literal',
}

export type ArgumentLiteral = {
	type: ArgumentType.LITERAL;
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	isHex?: boolean;
};
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
	// Try to fold literal-only mul/div expressions (handles *, /, and integer/integer fractions)
	const mulDivResult = parseLiteralMulDivExpression(argument);
	if (mulDivResult !== null) {
		return {
			type: ArgumentType.LITERAL,
			value: mulDivResult.value,
			isInteger: mulDivResult.isInteger,
			...(mulDivResult.isFloat64 && { isFloat64: true }),
		};
	}

	switch (true) {
		// Check for quoted string literals
		case argument.startsWith('"') && argument.endsWith('"') && argument.length >= 2: {
			const raw = argument.slice(1, -1);
			return { type: ArgumentType.STRING_LITERAL, value: decodeStringLiteral(raw) };
		}
		default: {
			const numericLiteral = parseNumericLiteralToken(argument);
			if (numericLiteral) {
				return {
					value: numericLiteral.value,
					type: ArgumentType.LITERAL,
					isInteger: numericLiteral.isInteger,
					...(numericLiteral.isFloat64 && { isFloat64: true }),
					...(numericLiteral.isHex && { isHex: true }),
				};
			}

			// Reject numeric-looking tokens that failed literal parsing so they do not silently
			// become identifiers. This keeps standalone and compound numeric syntax boundaries clear.
			// Exception: if the token is a valid single-operator compile-time expression with a
			// non-literal operand (e.g. 123*sizeof(name)), allow it through as an identifier.
			if (isNumericLikeInvalidToken(argument)) {
				if (parseConstantMulDivExpression(argument) !== null) {
					return { value: argument, type: ArgumentType.IDENTIFIER };
				}
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_NUMERIC_LITERAL,
					`Invalid numeric literal or expression: ${argument}`,
					{
						argument,
					}
				);
			}
			if (startsWithNumericPrefix(argument)) {
				if (parseConstantMulDivExpression(argument) !== null) {
					return { value: argument, type: ArgumentType.IDENTIFIER };
				}
				throw new SyntaxRulesError(
					SyntaxErrorCode.INVALID_IDENTIFIER,
					`Identifiers cannot start with numbers: ${argument}`,
					{
						argument,
					}
				);
			}
			return { value: argument, type: ArgumentType.IDENTIFIER };
		}
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

		it('parses non-f64 scientific notation literals', () => {
			// Scientific notation is treated as float-typed syntax even when the numeric value is integral.
			expect(parseArgument('1e3')).toEqual({ value: 1000, type: ArgumentType.LITERAL, isInteger: false });
			expect(parseArgument('1e-3')).toEqual({ value: 0.001, type: ArgumentType.LITERAL, isInteger: false });
			expect(parseArgument('-2.5e4')).toEqual({ value: -25000, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('parses hex integers', () => {
			expect(parseArgument('0x10')).toEqual({ value: 16, type: ArgumentType.LITERAL, isInteger: true, isHex: true });
		});

		it('parses binary integers', () => {
			expect(parseArgument('0b101')).toEqual({ value: 5, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('parses identifiers', () => {
			expect(parseArgument('value')).toEqual({ value: 'value', type: ArgumentType.IDENTIFIER });
		});

		it('rejects identifiers that start with numbers', () => {
			expect(() => parseArgument('1abc')).toThrow('Identifiers cannot start with numbers');
			expect(() => parseArgument('123ABC')).toThrow('Identifiers cannot start with numbers');
		});

		it('rejects invalid numeric literals or expressions', () => {
			expect(() => parseArgument('1e')).toThrow('Invalid numeric literal or expression');
			expect(() => parseArgument('1e+')).toThrow('Invalid numeric literal or expression');
			expect(() => parseArgument('0xZZ')).toThrow('Invalid numeric literal or expression');
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

		it('parses negative denominators as literal expressions', () => {
			expect(parseArgument('1/-2')).toEqual({ value: -0.5, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('folds literal-only multiplication', () => {
			expect(parseArgument('16*2')).toEqual({ value: 32, type: ArgumentType.LITERAL, isInteger: true });
			expect(parseArgument('3.5*4')).toEqual({ value: 14, type: ArgumentType.LITERAL, isInteger: false });
			expect(parseArgument('3.5*0.5')).toEqual({ value: 1.75, type: ArgumentType.LITERAL, isInteger: false });
		});

		it('folds hex literal in mul/div expression', () => {
			expect(parseArgument('0x10/2')).toEqual({ value: 8, type: ArgumentType.LITERAL, isInteger: true });
			expect(parseArgument('0x10*2')).toEqual({ value: 32, type: ArgumentType.LITERAL, isInteger: true });
		});

		it('folds f64-suffixed literal in mul/div expression', () => {
			expect(parseArgument('3f64*2')).toEqual({
				value: 6,
				type: ArgumentType.LITERAL,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('rejects chained or mixed numeric-looking operators', () => {
			expect(() => parseArgument('2*3*4')).toThrow('Invalid numeric literal or expression');
			expect(() => parseArgument('2*3/4')).toThrow('Invalid numeric literal or expression');
		});

		it('allows numeric-prefixed mixed compile-time expressions through as identifiers', () => {
			// These start with a numeric literal but have a non-literal RHS — pass through as identifier
			// for later resolution by the compile-time evaluator.
			expect(parseArgument('123*sizeof(name)')).toEqual({
				value: '123*sizeof(name)',
				type: ArgumentType.IDENTIFIER,
			});
			expect(parseArgument('2*SIZE')).toEqual({
				value: '2*SIZE',
				type: ArgumentType.IDENTIFIER,
			});
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

		it('rejects non-finite scientific notation literals', () => {
			expect(() => parseArgument('1e309')).toThrow('Invalid numeric literal');
			expect(() => parseArgument('1e309f64')).toThrow('Invalid numeric literal');
			expect(() => parseArgument('1e309*2')).toThrow('Invalid numeric literal or expression');
			expect(() => parseArgument('1e309f64*2')).toThrow('Invalid numeric literal or expression');
		});

		it('does not parse malformed f64 suffix forms as f64 literals', () => {
			// F64 (uppercase) is not valid
			expect(() => parseArgument('3.14F64')).toThrow('Invalid numeric literal or expression');
			// double-f is not valid
			expect(() => parseArgument('3.14ff64')).toThrow('Invalid numeric literal or expression');
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
