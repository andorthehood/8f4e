import { describe, expect, it } from 'vitest';

import round from './round';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('round instruction compiler', () => {
	it('rounds a float operand', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true });

		round(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'round',
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
