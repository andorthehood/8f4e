import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import shiftRightUnsigned from './shiftRightUnsigned';

describe('shiftRightUnsigned instruction compiler', () => {
	it('emits I32_SHR_U for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			shiftRightUnsigned,
			{
				lineNumber: 1,
				instruction: 'shiftRightUnsigned',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps known integer metadata when shifting known integer operands right as unsigned', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: -8 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 }
		);

		analyzeAndCompileInstruction(
			shiftRightUnsigned,
			{
				lineNumber: 1,
				instruction: 'shiftRightUnsigned',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 2147483644 },
		]);
	});
});
