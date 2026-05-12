import { describe, expect, it } from 'vitest';

import and from './and';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('and instruction compiler', () => {
	it('emits I32_AND for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		and(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'and',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('rejects non-integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'and',
			arguments: [],
		} as AST[number];

		expect(() => {
			validateInstruction(line, context);
		}).toThrowError();
	});

	it('keeps known integer metadata when and-ing known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: true, isNonZero: true, knownIntegerValue: 6 },
			{ isInteger: true, isNonZero: true, knownIntegerValue: 3 }
		);

		and(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'and',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: 2 }]);
	});
});
