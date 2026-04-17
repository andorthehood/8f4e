import { describe, expect, it } from 'vitest';

import cycle from './cycle';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('cycle instruction compiler', () => {
	it('compiles the cycle segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false }
		);

		cycle(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'cycle',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
