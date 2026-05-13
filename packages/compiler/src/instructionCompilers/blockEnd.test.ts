import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import blockEnd from './blockEnd';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('blockEnd instruction compiler', () => {
	it('restores expected result on the stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.BLOCK,
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
