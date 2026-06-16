import type { CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import ensureNonZero from './ensureNonZero';

describe('ensureNonZero instruction compiler', () => {
	it('ensures integer operand is non-zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			ensureNonZero,
			{
				lineNumber: 1,
				instruction: 'ensureNonZero',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('ensures float operand is non-zero with literal default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
			ensureNonZero,
			{
				lineNumber: 2,
				instruction: 'ensureNonZero',
				arguments: [{ type: ArgumentType.LITERAL, value: 2.5, isInteger: false }],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('ensures float64 operand is non-zero with float64 default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: false });

		analyzeAndCompileInstruction(
			ensureNonZero,
			{
				lineNumber: 3,
				instruction: 'ensureNonZero',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 2.5,
						isInteger: false,
					},
				],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
