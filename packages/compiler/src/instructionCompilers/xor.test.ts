import { describe, expect, it } from 'vitest';

import xor from './xor';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

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

	it('keeps known integer metadata when xor-ing known integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: true, isNonZero: true, knownIntegerValue: 6 },
			{ isInteger: true, isNonZero: true, knownIntegerValue: 3 }
		);

		xor(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'xor',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: 5 }]);
	});
});
