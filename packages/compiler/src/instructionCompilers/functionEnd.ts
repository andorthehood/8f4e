import { createFunctionType } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { ArgumentType, BLOCK_TYPE } from '../types';
import { functionValueTypeToWasmType, stackItemMatchesFunctionValueType } from '../utils/functionValueType';
import { withValidation } from '../withValidation';

import type { FunctionSignature, InstructionCompiler } from '../types';

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
		const returnTypes = line.arguments.map(
			arg =>
				(
					arg as {
						type: ArgumentType.IDENTIFIER;
						value: FunctionSignature['returns'][number];
					}
				).value
		);

		if (returnTypes.length > 8) {
			throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
		}

		// Validate stack matches return types
		if (context.stack.length !== returnTypes.length) {
			throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
		}

		for (let i = 0; i < returnTypes.length; i++) {
			const stackItem = context.stack[context.stack.length - returnTypes.length + i];
			if (!stackItemMatchesFunctionValueType(stackItem, returnTypes[i])) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
		}

		// Update function signature with return types
		if (context.currentFunctionSignature) {
			context.currentFunctionSignature.returns = returnTypes;

			// Register type signature in the type registry if available
			if (context.functionTypeRegistry) {
				const params = context.currentFunctionSignature.parameters.map(functionValueTypeToWasmType);
				const results = returnTypes.map(functionValueTypeToWasmType);

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
