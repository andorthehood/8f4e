import { describe, expect, it } from 'vitest';

import ifEnd from './ifEnd';

import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('ifEnd instruction compiler', () => {
	it('ends a conditional block with result', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.CONDITION,
					expectedResultIsInteger: true,
					hasExpectedResult: true,
				},
			],
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		ifEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'ifEnd',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws when missing condition block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			ifEnd(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'ifEnd',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
