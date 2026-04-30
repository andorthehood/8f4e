import { describe, expect, it } from 'vitest';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import loopEnd from './loopEnd';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('loopEnd instruction compiler', () => {
	it('ends a loop block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		loopEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'loopEnd',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('throws when missing loop block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			loopEnd(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'loopEnd',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
