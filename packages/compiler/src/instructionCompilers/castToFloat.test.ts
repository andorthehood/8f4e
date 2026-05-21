import { describe, expect, it } from 'vitest';

import castToFloat from './castToFloat';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('castToFloat instruction compiler', () => {
	it('converts int operand to float', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		analyzeAndCompileInstruction(
			castToFloat,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'castToFloat',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
