import type { CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import branchIfTrue from './branchIfTrue';

describe('branchIfTrue instruction compiler', () => {
	it('emits br_if bytecode', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true });

		analyzeAndCompileInstruction(
			branchIfTrue,
			{
				lineNumber: 1,
				instruction: 'branchIfTrue',
				arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
