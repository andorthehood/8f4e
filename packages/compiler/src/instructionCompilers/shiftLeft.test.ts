import { describe, expect, it } from 'vitest';

import shiftLeft from './shiftLeft';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

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
});
