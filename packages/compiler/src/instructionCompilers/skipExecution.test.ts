import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import skipExecution from './skipExecution';

describe('skipExecution instruction compiler', () => {
	it('sets skipExecutionInCycle flag when in module context', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			skipExecution,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#skipExecution',
				arguments: [],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.skipExecutionInCycle).toBe(true);
	});

	it('throws error when used outside module block', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [],
		});

		expect(() => {
			analyzeAndCompileInstruction(
				skipExecution,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: '#skipExecution',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrow();
	});

	it('is idempotent - multiple calls have same effect', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});

		analyzeAndCompileInstruction(
			skipExecution,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: '#skipExecution',
				arguments: [],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.skipExecutionInCycle).toBe(true);

		analyzeAndCompileInstruction(
			skipExecution,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: '#skipExecution',
				arguments: [],
				isBlockPrologue: true,
			} as CompilerASTLine,
			context
		);

		expect(context.skipExecutionInCycle).toBe(true);
	});
});
