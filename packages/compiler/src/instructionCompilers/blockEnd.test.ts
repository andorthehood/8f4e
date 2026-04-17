import { describe, expect, it } from 'vitest';

import blockEnd from './blockEnd';

import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('blockEnd instruction compiler', () => {
	it('restores expected result on the stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.BLOCK,
					expectedResultIsInteger: true,
					hasExpectedResult: true,
				},
			],
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		blockEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'blockEnd',
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
