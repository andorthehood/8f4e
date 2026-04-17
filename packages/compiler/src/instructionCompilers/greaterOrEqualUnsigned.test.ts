import { describe, expect, it } from 'vitest';

import greaterOrEqualUnsigned from './greaterOrEqualUnsigned';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('greaterOrEqualUnsigned instruction compiler', () => {
	it('emits I32_GE_U for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		greaterOrEqualUnsigned(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'greaterOrEqualUnsigned',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_GE for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

		greaterOrEqualUnsigned(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'greaterOrEqualUnsigned',
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
