import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import div from './div';

describe('div instruction compiler', () => {
	it('emits I32_DIV_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true },
			{ kind: 'value', valueType: 'int', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			div,
			{
				lineNumber: 1,
				instruction: 'div',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_DIV for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float', isNonZero: true },
			{ kind: 'value', valueType: 'float', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			div,
			{
				lineNumber: 1,
				instruction: 'div',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_DIV for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float64', isNonZero: true },
			{ kind: 'value', valueType: 'float64', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			div,
			{
				lineNumber: 1,
				instruction: 'div',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws on division by zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		expect(() => {
			analyzeAndCompileInstruction(
				div,
				{
					lineNumber: 1,
					instruction: 'div',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});

	it('keeps known integer metadata when dividing known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 8 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 4 }
		);

		analyzeAndCompileInstruction(
			div,
			{
				lineNumber: 1,
				instruction: 'div',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 2 }]);
	});

	it('marks known zero integer division results as zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 2 }
		);

		analyzeAndCompileInstruction(
			div,
			{
				lineNumber: 1,
				instruction: 'div',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false, knownIntegerValue: 0 }]);
	});
});
