import { describe, expect, it } from 'vitest';

import shiftRight from './shiftRight';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('shiftRight instruction compiler', () => {
	it('emits I32_SHR_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		shiftRight(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftRight',
				arguments: [],
			} as AST[number],
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
			{ isInteger: true, isNonZero: true, knownIntegerValue: -8 },
			{ isInteger: true, isNonZero: true, knownIntegerValue: 1 }
		);

		shiftRight(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftRight',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: -4 }]);
	});
});
