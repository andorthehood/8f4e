import { describe, expect, it } from 'vitest';

import hasChanged from './hasChanged';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('hasChanged instruction compiler', () => {
	it('compiles the change detector segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		hasChanged(
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'hasChanged',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
