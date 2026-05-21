import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-spec';

import branch from './branch';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('branch instruction compiler', () => {
	it('emits br bytecode', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			branch,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'branch',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
