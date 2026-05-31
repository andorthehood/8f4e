import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import param from './param';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('param instruction compiler', () => {
	it('registers a function parameter', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('int'), classifyIdentifier('value')],
			} as CompilerASTLine,
			context
		);

		expect({
			locals: context.locals,
			currentFunctionSignature: context.currentFunctionSignature,
		}).toMatchSnapshot();
	});

	it('registers a float64 function parameter', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('float64'), classifyIdentifier('x')],
			} as CompilerASTLine,
			context
		);

		expect({
			locals: context.locals,
			currentFunctionSignature: context.currentFunctionSignature,
		}).toMatchSnapshot();
	});

	it('registers a pointer function parameter with pointee metadata', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('float*'), classifyIdentifier('buffer')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals.buffer).toMatchObject({
			pointeeBaseType: 'float',
			pointerDepth: 1,
			index: 0,
		});
		expect(context.currentFunctionSignature?.parameters).toEqual(['float*']);
	});

	it('throws when declared after locals', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: { existing: { isInteger: true, index: 0 } },
		});

		expect(() => {
			analyzeAndCompileInstruction(
				param,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'param',
					arguments: [classifyIdentifier('int'), classifyIdentifier('late')],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
