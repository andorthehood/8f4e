import type { CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import branch from './branch';

describe('branch instruction compiler', () => {
	it('emits br bytecode', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			branch,
			{
				lineNumber: 1,
				instruction: 'branch',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
