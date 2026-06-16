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
					expectedResultTypes: [],
				},
			],
			currentFunctionParameterCount: 0,
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumber: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('int'), classifyIdentifier('value')],
			} as CompilerASTLine,
			context
		);

		expect({
			locals: context.locals,
			currentFunctionParameterCount: context.currentFunctionParameterCount,
		}).toMatchSnapshot();
	});

	it('registers a float64 function parameter', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
			currentFunctionParameterCount: 0,
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumber: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('float64'), classifyIdentifier('x')],
			} as CompilerASTLine,
			context
		);

		expect({
			locals: context.locals,
			currentFunctionParameterCount: context.currentFunctionParameterCount,
		}).toMatchSnapshot();
	});

	it('registers a pointer function parameter with pointee metadata', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
			currentFunctionParameterCount: 0,
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumber: 1,
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
		expect(context.currentFunctionParameterCount).toBe(1);
	});

	it('registers an unsigned narrow pointer function parameter with pointee metadata', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultTypes: [],
				},
			],
			currentFunctionParameterCount: 0,
			locals: {},
		});

		analyzeAndCompileInstruction(
			param,
			{
				lineNumber: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('int8u*'), classifyIdentifier('bytes')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals.bytes).toMatchObject({
			pointeeBaseType: 'int8u',
			pointerDepth: 1,
			index: 0,
		});
		expect(context.currentFunctionParameterCount).toBe(1);
	});
});
