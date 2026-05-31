import type { CompilerASTLine, FunctionTypeRegistry } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import functionEnd from './functionEnd';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('functionEnd instruction compiler', () => {
	it('updates function signature and clears stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,expectedResultTypes: [],
				},
			],
			currentFunctionSignature: { parameters: ['int'], returns: [] },
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatures: [],
				types: [],
			} as FunctionTypeRegistry,
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			functionEnd,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'functionEnd',
				arguments: [classifyIdentifier('int')],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			currentFunctionSignature: context.currentFunctionSignature,
			functionTypeRegistry: {
				baseTypeIndex: context.functionTypeRegistry?.baseTypeIndex,
				signatureCount: context.functionTypeRegistry?.signatures.length,
				typesLength: context.functionTypeRegistry?.types.length,
			},
		}).toMatchSnapshot();
		expect(context.currentFunctionTypeIndex).toBe(0);
	});

	it('accepts float64 return type and emits WASM_TYPE_F64 in type registry', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,expectedResultTypes: [],
				},
			],
			currentFunctionSignature: { parameters: ['float64'], returns: [] },
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatures: [],
				types: [],
			} as FunctionTypeRegistry,
		});
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: false });

		analyzeAndCompileInstruction(
			functionEnd,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'functionEnd',
				arguments: [classifyIdentifier('float64')],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			blockStack: context.blockStack,
			currentFunctionSignature: context.currentFunctionSignature,
			functionTypeRegistry: {
				baseTypeIndex: context.functionTypeRegistry?.baseTypeIndex,
				signatureCount: context.functionTypeRegistry?.signatures.length,
				typesLength: context.functionTypeRegistry?.types.length,
			},
		}).toMatchSnapshot();
		expect(context.currentFunctionTypeIndex).toBe(0);
	});

	it('reuses a registered function type for matching signatures', () => {
		const functionTypeRegistry: FunctionTypeRegistry = {
			baseTypeIndex: 3,
			signatures: [],
			types: [],
		};
		const createFunctionContext = () =>
			createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BlockType.FUNCTION,expectedResultTypes: [],
					},
				],
				currentFunctionSignature: { parameters: ['int'], returns: [] },
				functionTypeRegistry,
			});
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'functionEnd',
			arguments: [classifyIdentifier('int')],
		} as CompilerASTLine;
		const firstContext = createFunctionContext();
		const secondContext = createFunctionContext();
		firstContext.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });
		secondContext.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(functionEnd, line, firstContext);
		analyzeAndCompileInstruction(functionEnd, line, secondContext);

		expect(firstContext.currentFunctionTypeIndex).toBe(3);
		expect(secondContext.currentFunctionTypeIndex).toBe(3);
		expect(functionTypeRegistry.signatures).toHaveLength(1);
		expect(functionTypeRegistry.types).toHaveLength(1);
	});

	it('throws when missing function block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		expect(() => {
			analyzeAndCompileInstruction(
				functionEnd,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'functionEnd',
					arguments: [classifyIdentifier('int')],
				} as CompilerASTLine,
				context
			);
		}).toThrowError();
	});
});
