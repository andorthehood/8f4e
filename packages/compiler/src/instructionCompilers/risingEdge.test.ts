import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import risingEdge from './risingEdge';

describe('risingEdge instruction compiler', () => {
	it('compiles the rising edge segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			risingEdge,
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'risingEdge',
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

	it('compiles the rising edge segment for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
			risingEdge,
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'risingEdge',
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
