import type { CompilerASTLine } from '@8f4e/language-spec';
import { analyzeInstruction } from '@8f4e/stack-analyzer/testing';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import and from './and';

describe('and instruction compiler', () => {
	it('emits I32_AND for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			and,
			{
				lineNumber: 1,
				instruction: 'and',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('rejects non-integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);
		const line = {
			lineNumber: 1,
			instruction: 'and',
			arguments: [],
		} as CompilerASTLine;

		expect(() => {
			analyzeInstruction(line, context);
		}).toThrowError();
	});

	it('keeps known integer metadata when and-ing known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 6 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 3 }
		);

		analyzeAndCompileInstruction(
			and,
			{
				lineNumber: 1,
				instruction: 'and',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 2 }]);
	});
});
