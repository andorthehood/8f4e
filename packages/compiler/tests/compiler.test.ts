import { describe, test, expect } from 'vitest';

import { ArgumentType } from '../src/types';
import { isComment, isValidInstruction, parseArgument, parseLine, compileToAST } from '../src/compiler';

import type { AST } from '../src/types';

describe('parseArgument', () => {
	const literals: [string, ArgumentType, number, boolean][] = [
		['0b1', ArgumentType.LITERAL, 1, true],
		['0b01', ArgumentType.LITERAL, 1, true],
		['0b001', ArgumentType.LITERAL, 1, true],
		['0xff', ArgumentType.LITERAL, 255, true],
		['100', ArgumentType.LITERAL, 100, true],
		['0.0', ArgumentType.LITERAL, 0, false],
		['1.00', ArgumentType.LITERAL, 1, false],
		['1.1', ArgumentType.LITERAL, 1.1, false],
		['-2.3', ArgumentType.LITERAL, -2.3, false],
	];

	const identifiers: [string, ArgumentType, string][] = [
		['foo', ArgumentType.IDENTIFIER, 'foo'],
		['1foo', ArgumentType.IDENTIFIER, '1foo'],
		['foo1', ArgumentType.IDENTIFIER, 'foo1'],
		['f0o', ArgumentType.IDENTIFIER, 'f0o'],
	];

	test.each(literals)('given %p as input the output is %p', (argument, type, value, isInteger) => {
		expect(parseArgument(argument)).toStrictEqual({ type, value, isInteger });
	});

	test.each(identifiers)('given %p as input the output is %p', (argument, type, value) => {
		expect(parseArgument(argument)).toStrictEqual({ type, value });
	});
});

describe('parseLine', () => {
	const fixtures: [number, string, AST[number]][] = [
		[
			1,
			'int alpha 1',
			{
				arguments: [
					{
						type: ArgumentType.IDENTIFIER,
						value: 'alpha',
					},
					{
						type: ArgumentType.LITERAL,
						value: 1,
						isInteger: true,
					},
				],
				instruction: 'int',
				lineNumber: 1,
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
					},
				],
				instruction: 'push',
				lineNumber: 100,
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

		// All AST entries should have lineNumber 5 (the call site)
		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumber).toBe(5);
		expect(ast[1].lineNumber).toBe(5);
		expect(ast[2].lineNumber).toBe(5);
	});

	test('should use actual line numbers when lineMetadata is not provided', () => {
		const code = ['push 10', 'push 20', 'add'];

		const ast = compileToAST(code);

		// Should use 0-indexed line numbers
		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumber).toBe(0);
		expect(ast[1].lineNumber).toBe(1);
		expect(ast[2].lineNumber).toBe(2);
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
});
