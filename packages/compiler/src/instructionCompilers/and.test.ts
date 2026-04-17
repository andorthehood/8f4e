import { describe, expect, it } from 'vitest';

import and from './and';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

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

		expect(() => {
			and(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'and',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
