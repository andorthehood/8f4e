import { describe, expect, it } from 'vitest';

import mapBegin from './mapBegin';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('mapBegin instruction compiler', () => {
	it('opens a map block for int input type', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			mapBegin,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'mapBegin',
				arguments: [classifyIdentifier('int')],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});

	it('opens a map block for float input type', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			mapBegin,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'mapBegin',
				arguments: [classifyIdentifier('float')],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});

	it('opens a map block for float64 input type', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			mapBegin,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'mapBegin',
				arguments: [classifyIdentifier('float64')],
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});
});
