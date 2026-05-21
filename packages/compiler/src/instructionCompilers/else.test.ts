import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import _else from './else';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('else instruction compiler', () => {
	it('emits else bytecode and restores block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.CONDITION,
					expectedResultIsInteger: true,
					hasExpectedResult: true,
				},
			],
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			_else,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'else',
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

	it('throws when no matching block start exists', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });

		expect(() => {
			analyzeAndCompileInstruction(
				_else,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'else',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
