import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import loopEnd from './loopEnd';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('loopEnd instruction compiler', () => {
	it('ends a loop block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__loopCounter1',
					loopCounterLocal: { isInteger: true, index: 0 },
				},
			],
		});

		analyzeAndCompileInstruction(
			loopEnd,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'loopEnd',
				arguments: [],
			} as CompilerASTLine,
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
			analyzeAndCompileInstruction(
				loopEnd,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'loopEnd',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
