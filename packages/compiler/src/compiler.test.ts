import { parseArgument, parseLine } from './compiler';
import { ArgumentType, AST } from './types';

describe('parseArgument', () => {
	const fixtures: [string, ArgumentType, number | string][] = [
		['0b1', ArgumentType.LITERAL, 1],
		['0b01', ArgumentType.LITERAL, 1],
		['0b001', ArgumentType.LITERAL, 1],
		['0xff', ArgumentType.LITERAL, 255],
		['100', ArgumentType.LITERAL, 100],
		['foo', ArgumentType.IDENTIFIER, 'foo'],
		['1foo', ArgumentType.IDENTIFIER, '1foo'],
		['foo1', ArgumentType.IDENTIFIER, 'foo1'],
		['f0o', ArgumentType.IDENTIFIER, 'f0o'],
	];

	test.each(fixtures)('given %p as input the output is %p', (argument, type, value) => {
		expect(parseArgument(argument)).toStrictEqual({ type, value });
	});
});

describe('parseLine', () => {
	const fixtures: [number, string, AST[number]][] = [
		[
			1,
			'memory alpha 1',
			{
				arguments: [
					{
						type: ArgumentType.IDENTIFIER,
						value: 'alpha',
					},
					{
						type: ArgumentType.LITERAL,
						value: 1,
					},
				],
				instruction: 'memory',
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
