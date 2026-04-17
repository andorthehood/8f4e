import { describe, expect, it } from 'vitest';

import { withValidation } from './withValidation';

import { BLOCK_TYPE, type InstructionCompiler } from '../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};

const createContext = () =>
	({
		blockStack: [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.MODULE,
			},
		],
		stack: [],
	}) as unknown as Parameters<InstructionCompiler>[1];

describe('withValidation (in-source)', () => {
	it('calls compiler when validation passes', () => {
		const compiler = withValidation({ minOperands: 1 }, (_line, context) => {
			context.stack.push({ isInteger: true });
			return context;
		});
		const context = createContext();
		context.stack.push({ isInteger: true });

		expect(() => compiler(line, context)).not.toThrow();
		expect(context.stack).toHaveLength(2);
	});

	it('rejects instructions in constants blocks by default', () => {
		const compiler = withValidation({}, (_line, context) => context);
		const context = createContext();
		context.blockStack = [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.CONSTANTS,
			},
		];

		expect(() => compiler(line, context)).toThrow();
	});

	it('prefers validateOperands output over static spec', () => {
		const compiler = withValidation(
			{
				minOperands: 2,
				operandTypes: 'float',
				validateOperands: () => ({ minOperands: 1, operandTypes: 'int' }),
			},
			(_line, context) => context
		);
		const context = createContext();
		context.stack.push({ isInteger: true });

		expect(() => compiler(line, context)).not.toThrow();
	});

	it('validates argument types when configured', () => {
		const compiler = withValidation({ argumentTypes: 'identifier' }, (_line, context) => context);
		const context = createContext();
		const identifierLine: Parameters<InstructionCompiler>[0] = {
			...line,
			arguments: [classifyIdentifier('arg')],
		};

		expect(() => compiler(identifierLine, context)).not.toThrow();
	});
});
