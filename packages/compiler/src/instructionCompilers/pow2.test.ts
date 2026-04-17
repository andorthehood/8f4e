import { describe, expect, it } from 'vitest';

import pow2 from './pow2';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('pow2 instruction compiler', () => {
	it('computes power of two', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		pow2(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'pow2',
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
