import { describe, expect, it } from 'vitest';

import shiftRight from './shiftRight';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('shiftRight instruction compiler', () => {
	it('emits I32_SHR_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			shiftRight,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftRight',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps known integer metadata when shifting known integer operands right', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: -8 },
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 }
		);

		analyzeAndCompileInstruction(
			shiftRight,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftRight',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: -4 }]);
	});
});
