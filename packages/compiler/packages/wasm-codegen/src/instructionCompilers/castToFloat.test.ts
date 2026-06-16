import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import castToFloat from './castToFloat';

describe('castToFloat instruction compiler', () => {
	it('converts int operand to float', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true });

		analyzeAndCompileInstruction(
			castToFloat,
			{
				lineNumber: 1,
				instruction: 'castToFloat',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
