import { describe, expect, it } from 'vitest';

import param from './param';

import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('param instruction compiler', () => {
	it('registers a function parameter', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		param(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('int'), classifyIdentifier('value')],
			} as AST[number],
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
					blockType: BLOCK_TYPE.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		param(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('float64'), classifyIdentifier('x')],
			} as AST[number],
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
					blockType: BLOCK_TYPE.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: {},
		});

		param(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'param',
				arguments: [classifyIdentifier('float*'), classifyIdentifier('buffer')],
			} as AST[number],
			context
		);

		expect(context.locals.buffer).toMatchObject({
			isInteger: true,
			pointeeBaseType: 'float',
			index: 0,
		});
		expect(context.currentFunctionSignature?.parameters).toEqual(['float*']);
	});

	it('throws when declared after locals', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BLOCK_TYPE.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: [], returns: [] },
			locals: { existing: { isInteger: true, index: 0 } },
		});

		expect(() => {
			param(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'param',
					arguments: [classifyIdentifier('int'), classifyIdentifier('late')],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
