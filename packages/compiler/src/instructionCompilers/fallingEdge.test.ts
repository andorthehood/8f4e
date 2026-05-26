import { describe, expect, it } from 'vitest';

import fallingEdge from './fallingEdge';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('fallingEdge instruction compiler', () => {
	it('compiles the falling edge segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			fallingEdge,
			{
				lineNumberBeforeMacroExpansion: 5,
				lineNumberAfterMacroExpansion: 5,
				instruction: 'fallingEdge',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
