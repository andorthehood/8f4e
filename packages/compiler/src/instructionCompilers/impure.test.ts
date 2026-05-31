import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import impure from './impure';

describe('impure instruction compiler', () => {
	it('sets currentFunctionIsImpure when in function context', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.FUNCTION,expectedResultTypes: [],
				},
			],
			mode: 'function',
			codeBlockType: 'function',
		});

		analyzeAndCompileInstruction(
			impure,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#impure',
				arguments: [],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.currentFunctionIsImpure).toBe(true);
	});

	it('throws error when used outside function block', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => {
			analyzeAndCompileInstruction(
				impure,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#impure',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrow();
	});
});
