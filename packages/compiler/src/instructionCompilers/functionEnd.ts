import { createFunctionType } from '@8f4e/compiler-wasm-utils';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';
import { functionValueTypeToWasmType } from '../utils/functionValueType';
import { popBlock } from '../utils/blockStack';

import type { FunctionSignature, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `functionEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const functionEnd: InstructionCompiler = (line, context) => {
	const block = popBlock(context);

	if (!block || block.blockType !== BlockType.FUNCTION) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	// Parse return types: functionEnd [<returnType1> <returnType2> ...]
	const returnTypes = line.arguments.map(
		arg =>
			(
				arg as {
					type: typeof ArgumentType.IDENTIFIER;
					value: FunctionSignature['returns'][number];
				}
			).value
	);

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

	return context;
};

export default functionEnd;
