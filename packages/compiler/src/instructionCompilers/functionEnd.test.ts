import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import functionEnd from './functionEnd';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, FunctionTypeRegistry } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('functionEnd instruction compiler', () => {
	it('updates function signature and clears stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: ['int'], returns: [] },
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatureMap: new Map<string, number>(),
				types: [],
			} as FunctionTypeRegistry,
		});
		context.stack.push({ isInteger: true, isNonZero: false });

		functionEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'functionEnd',
				arguments: [classifyIdentifier('int')],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			currentFunctionSignature: context.currentFunctionSignature,
			functionTypeRegistry: {
				baseTypeIndex: context.functionTypeRegistry?.baseTypeIndex,
				signatureMapSize: context.functionTypeRegistry?.signatureMap.size,
				typesLength: context.functionTypeRegistry?.types.length,
			},
		}).toMatchSnapshot();
	});

	it('accepts float64 return type and emits WASM_TYPE_F64 in type registry', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
			currentFunctionSignature: { parameters: ['float64'], returns: [] },
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatureMap: new Map<string, number>(),
				types: [],
			} as FunctionTypeRegistry,
		});
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

		functionEnd(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'functionEnd',
				arguments: [classifyIdentifier('float64')],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			currentFunctionSignature: context.currentFunctionSignature,
			functionTypeRegistry: {
				baseTypeIndex: context.functionTypeRegistry?.baseTypeIndex,
				signatureMapSize: context.functionTypeRegistry?.signatureMap.size,
				typesLength: context.functionTypeRegistry?.types.length,
			},
		}).toMatchSnapshot();
	});

	it('throws when missing function block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		expect(() => {
			functionEnd(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'functionEnd',
					arguments: [classifyIdentifier('int')],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
