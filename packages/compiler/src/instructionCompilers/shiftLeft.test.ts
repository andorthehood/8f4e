import { describe, expect, it } from 'vitest';

import shiftLeft from './shiftLeft';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('shiftLeft instruction compiler', () => {
	it('emits I32_SHL for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		shiftLeft(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftLeft',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps known integer metadata when shifting known integer operands left', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: true, isNonZero: true, knownIntegerValue: 2 },
			{ isInteger: true, isNonZero: true, knownIntegerValue: 2 }
		);

		shiftLeft(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'shiftLeft',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: 8 }]);
	});
});
