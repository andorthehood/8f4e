import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import drop from './drop';

describe('drop instruction compiler', () => {
	it('drops the top stack value', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			drop,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'drop',
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
