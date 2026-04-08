import { compileToAST, parseLine, classifyIdentifier } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';
import { isComment, isValidInstruction, parseArgument, SyntaxErrorCode, SyntaxRulesError } from '@8f4e/tokenizer';

import { ArgumentType } from '../src/types';

import type { AST } from '../src/types';

describe('parseArgument', () => {
	const literals: [string, ArgumentType, number, boolean][] = [
		['0b1', ArgumentType.LITERAL, 1, true],
		['0b01', ArgumentType.LITERAL, 1, true],
		['0b001', ArgumentType.LITERAL, 1, true],
		['100', ArgumentType.LITERAL, 100, true],
		['0.0', ArgumentType.LITERAL, 0, false],
		['1.00', ArgumentType.LITERAL, 1, false],
		['1.1', ArgumentType.LITERAL, 1.1, false],
		['-2.3', ArgumentType.LITERAL, -2.3, false],
	];

	const identifiers: [string, ArgumentType, string][] = [
		['foo', ArgumentType.IDENTIFIER, 'foo'],
		['foo1', ArgumentType.IDENTIFIER, 'foo1'],
		['f0o', ArgumentType.IDENTIFIER, 'f0o'],
	];

	test.each(literals)('given %p as input the output is %p', (argument, type, value, isInteger) => {
		expect(parseArgument(argument)).toStrictEqual({ type, value, isInteger });
	});

	test('parses hex literal with isHex flag', () => {
		expect(parseArgument('0xff')).toStrictEqual({
			type: ArgumentType.LITERAL,
			value: 255,
			isInteger: true,
			isHex: true,
		});
	});

	test.each(identifiers)('given %p as input the output is %p', (argument, type, value) => {
		expect(parseArgument(argument)).toMatchObject({ type, value });
	});

	test('rejects identifiers that start with numbers', () => {
		expect(() => parseArgument('1foo')).toThrowError(
			expect.objectContaining({
				name: 'SyntaxRulesError',
				code: SyntaxErrorCode.INVALID_IDENTIFIER,
			})
		);
	});
});

describe('parseLine', () => {
	const fixtures: [number, string, AST[number]][] = [
		[
			1,
			'int alpha 1',
			{
				arguments: [
					classifyIdentifier('alpha'),
					{
						type: ArgumentType.LITERAL,
						value: 1,
						isInteger: true,
					},
				],
				instruction: 'int',
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				isSemanticOnly: false,
				isMemoryDeclaration: true,
			},
		],
		[
			100,
			'push 0xff',
			{
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 255,
						isInteger: true,
						isHex: true,
					},
				],
				instruction: 'push',
				lineNumberBeforeMacroExpansion: 100,
				lineNumberAfterMacroExpansion: 100,
				isSemanticOnly: false,
				isMemoryDeclaration: false,
			},
		],
	];

	test.each(fixtures)('given %p as input the output is %p', (lineNumber, line, ast) => {
		expect(parseLine(line, lineNumber)).toStrictEqual(ast);
	});
});

describe('isComment', () => {
	const fixtures: [string, boolean][] = [
		['; hello', true],
		['hello', false],
	];

	test.each(fixtures)('given %p the output is %p', (line, value) => {
		expect(isComment(line)).toBe(value);
	});
});

describe('isValidInstruction', () => {
	const fixtures: [string, boolean][] = [
		['hello', true],
		['hello 10', true],
	];

	test.each(fixtures)('given %p the output is %p', (line, value) => {
		expect(isValidInstruction(line)).toBe(value);
	});
});

describe('compileToAST', () => {
	test('should use callSiteLineNumber from lineMetadata when provided', () => {
		const code = ['push 10', 'push 20', 'add'];
		const lineMetadata = [
			{ callSiteLineNumber: 5 },
			{ callSiteLineNumber: 5, macroId: 'double' },
			{ callSiteLineNumber: 5, macroId: 'double' },
		];

		const ast = compileToAST(code, lineMetadata);

		// Call-site line numbers are preserved for diagnostics.
		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});

	test('should use actual line numbers when lineMetadata is not provided', () => {
		const code = ['push 10', 'push 20', 'add'];

		const ast = compileToAST(code);

		// Both line number fields match when no macro expansion happened.
		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(0);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(1);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(2);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});
});

describe('parseLine string literals', () => {
	test('parses a quoted string argument as STRING_LITERAL', () => {
		const result = parseLine('push "hello"', 0);
		expect(result.instruction).toBe('push');
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'hello' }]);
	});

	test('parses a quoted string with spaces as a single argument', () => {
		const result = parseLine('push "hello world"', 0);
		expect(result.arguments).toHaveLength(1);
		expect(result.arguments[0]).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'hello world' });
	});

	test('preserves a quoted semicolon inside a string', () => {
		const result = parseLine('push "a;b"', 0);
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'a;b' }]);
	});

	test('handles escape sequences inside a quoted string', () => {
		const result = parseLine('push "a\\nb"', 0);
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'a\nb' }]);
	});

	test('throws on unterminated string literal', () => {
		expect(() => parseLine('push "hello', 0)).toThrow('Unterminated string literal');
	});

	test('adds line metadata to parse-time syntax errors', () => {
		try {
			parseLine('push 1e309', 7, 12);
			throw new Error('Expected parseLine to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.INVALID_NUMERIC_LITERAL);
			expect((error as SyntaxRulesError).line).toEqual(
				expect.objectContaining({
					lineNumberBeforeMacroExpansion: 7,
					lineNumberAfterMacroExpansion: 12,
					instruction: 'push',
				})
			);
		}
	});

	test('exposes instruction in line metadata for argument-level errors', () => {
		let thrownError: SyntaxRulesError | undefined;
		try {
			parseLine('push', 5, 8);
		} catch (error) {
			thrownError = error as SyntaxRulesError;
		}
		expect(thrownError).toBeInstanceOf(SyntaxRulesError);
		expect(thrownError?.line?.lineNumberBeforeMacroExpansion).toBe(5);
		expect(thrownError?.line?.lineNumberAfterMacroExpansion).toBe(8);
		expect(thrownError?.line?.instruction).toBe('push');
	});
});

describe('compileToAST', () => {
	test('exposes line location in block structure errors via the line property', () => {
		let thrownError: SyntaxRulesError | undefined;
		try {
			compileToAST(['push 1', 'if', 'push 10']);
		} catch (error) {
			thrownError = error as SyntaxRulesError;
		}
		expect(thrownError).toBeInstanceOf(SyntaxRulesError);
		expect(thrownError?.line?.lineNumberBeforeMacroExpansion).toBe(1);
		expect(thrownError?.line?.lineNumberAfterMacroExpansion).toBe(1);
		expect(thrownError?.line?.instruction).toBe('if');
	});
});
