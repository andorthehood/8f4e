import { describe, test, expect } from 'vitest';

import { ArgumentType } from '../src/types';
import { isComment, isValidInstruction, parseArgument, parseLine } from '../src/compiler';

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
