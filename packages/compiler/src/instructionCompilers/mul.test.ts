import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import mul from './mul';

describe('mul instruction compiler', () => {
	it('emits I32_MUL for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			mul,
			{
				lineNumber: 1,
				instruction: 'mul',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_MUL for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			mul,
			{
				lineNumber: 1,
				instruction: 'mul',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_MUL for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float64', isNonZero: false },
			{ kind: 'value', valueType: 'float64', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			mul,
			{
				lineNumber: 1,
				instruction: 'mul',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps known integer metadata when multiplying known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 2 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 4 }
		);

		analyzeAndCompileInstruction(
			mul,
			{
				lineNumber: 1,
				instruction: 'mul',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 8 }]);
	});
});
