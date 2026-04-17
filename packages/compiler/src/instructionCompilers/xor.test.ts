import { describe, expect, it } from 'vitest';

import xor from './xor';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('xor instruction compiler', () => {
	it('emits I32_XOR for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		xor(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'xor',
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
