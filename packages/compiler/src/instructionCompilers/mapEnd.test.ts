import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import mapEnd from './mapEnd';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('mapEnd instruction compiler', () => {
	it('throws on missing argument', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BlockType.MAP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					mapState: {
						inputIsInteger: true,
						inputIsFloat64: false,
						rows: [],
						defaultSet: false,
					},
				},
			],
		});
		context.stack.push({ isInteger: true });

		expect(() => {
			analyzeAndCompileInstruction(
				mapEnd,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapEnd',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});

	it('throws when used outside a map block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true });

		expect(() => {
			analyzeAndCompileInstruction(
				mapEnd,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapEnd',
					arguments: [classifyIdentifier('int')],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});

	it('emits DROP + typed zero for zero rows', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BlockType.MAP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					mapState: {
						inputIsInteger: true,
						inputIsFloat64: false,
						rows: [],
						defaultSet: false,
					},
				},
			],
		});
		context.stack.push({ isInteger: true });

		analyzeAndCompileInstruction(
			mapEnd,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'mapEnd',
				arguments: [classifyIdentifier('int')],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
			blockStack: context.blockStack,
		}).toMatchSnapshot();
	});
});
