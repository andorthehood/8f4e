import { describe, expect, it } from 'vitest';

import drop from './drop';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('drop instruction compiler', () => {
	it('drops the top stack value', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: true });

		drop(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'drop',
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
