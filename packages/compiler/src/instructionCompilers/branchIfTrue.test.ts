import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-spec';

import branchIfTrue from './branchIfTrue';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('branchIfTrue instruction compiler', () => {
	it('emits br_if bytecode', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		analyzeAndCompileInstruction(
			branchIfTrue,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
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
