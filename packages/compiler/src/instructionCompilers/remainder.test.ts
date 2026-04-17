import { describe, expect, it } from 'vitest';

import remainder from './remainder';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('remainder instruction compiler', () => {
	it('emits I32_REM_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: true });

		remainder(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'remainder',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws on division by zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: false });

		expect(() => {
			remainder(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'remainder',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
