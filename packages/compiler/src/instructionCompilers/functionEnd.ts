import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE, ArgumentType } from '../types';
import Type from '../wasmUtils/type';
import { createFunctionType } from '../wasmUtils/sectionHelpers';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler, FunctionTypeRegistry } from '../types';

/**
 * Instruction compiler for `functionEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const functionEnd: InstructionCompiler = withValidation(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		const block = context.blockStack.pop();

		if (!block || block.blockType !== BLOCK_TYPE.FUNCTION) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		// Parse return types: functionEnd [<returnType1> <returnType2> ...]
		const returnTypes = line.arguments.map(arg => {
			if (arg.type !== ArgumentType.IDENTIFIER || (arg.value !== 'int' && arg.value !== 'float')) {
				throw getError(ErrorCode.INVALID_FUNCTION_SIGNATURE, line, context);
			}
			return arg.value as 'int' | 'float';
		});

		if (returnTypes.length > 8) {
			throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
		}

		// Validate stack matches return types
		if (context.stack.length !== returnTypes.length) {
			throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
		}

		for (let i = 0; i < returnTypes.length; i++) {
			const stackItem = context.stack[context.stack.length - returnTypes.length + i];
			const expectedInteger = returnTypes[i] === 'int';
			if (stackItem.isInteger !== expectedInteger) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
		}

		// Update function signature with return types
		if (context.currentFunctionSignature) {
			context.currentFunctionSignature.returns = returnTypes;

			// Register type signature in the type registry if available
			if (context.functionTypeRegistry) {
				const params = context.currentFunctionSignature.parameters.map(type => (type === 'int' ? Type.I32 : Type.F32));
				const results = returnTypes.map(type => (type === 'int' ? Type.I32 : Type.F32));

				const signature = JSON.stringify({ params, results });

				if (!context.functionTypeRegistry.signatureMap.has(signature)) {
					const typeIndex = context.functionTypeRegistry.baseTypeIndex + context.functionTypeRegistry.types.length;
					context.functionTypeRegistry.signatureMap.set(signature, typeIndex);
					context.functionTypeRegistry.types.push(createFunctionType(params, results));
				}
			}
		}

		// Clear the stack (return values are consumed)
		context.stack = [];

		return context;
	}
);

export default functionEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('functionEnd instruction compiler', () => {
		it('updates function signature and clears stack', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.FUNCTION,
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
					lineNumber: 1,
					instruction: 'functionEnd',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
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
						lineNumber: 1,
						instruction: 'functionEnd',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
