import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import remainder from './remainder';

describe('remainder instruction compiler', () => {
	it('emits I32_REM_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true },
			{ kind: 'value', valueType: 'int', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			remainder,
			{
				lineNumber: 1,
				instruction: 'remainder',
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
				remainder,
				{
					lineNumber: 1,
					instruction: 'remainder',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});

	it('keeps known integer metadata when taking the remainder of known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 9 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 4 }
		);

		analyzeAndCompileInstruction(
			remainder,
			{
				lineNumber: 1,
				instruction: 'remainder',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 }]);
	});
});
