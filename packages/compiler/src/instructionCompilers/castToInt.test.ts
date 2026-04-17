import { describe, expect, it } from 'vitest';

import castToInt from './castToInt';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('castToInt instruction compiler', () => {
	it('converts float operand to int', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true });

		castToInt(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'castToInt',
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
