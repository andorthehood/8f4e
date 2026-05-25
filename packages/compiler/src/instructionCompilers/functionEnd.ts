import { createFunctionType } from '@8f4e/compiler-wasm-utils';
import { ArgumentType } from '@8f4e/compiler-spec';

import { functionValueTypeToWasmType } from '../utils/functionValueType';
import { popBlock } from '../utils/blockStack';

import type { AST, FunctionCodegenContext, FunctionSignature, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `functionEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const functionEnd: InstructionCompiler<AST[number], FunctionCodegenContext> = (line, context) => {
	popBlock(context)!;

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
	context.currentFunctionSignature.returns = returnTypes;

	// Register type signature in the type registry
	const params = context.currentFunctionSignature.parameters.map(functionValueTypeToWasmType);
	const results = returnTypes.map(functionValueTypeToWasmType);

	const signature = JSON.stringify({ params, results });
	let typeIndex = context.functionTypeRegistry.signatureMap.get(signature);

	if (typeIndex === undefined) {
		typeIndex = context.functionTypeRegistry.baseTypeIndex + context.functionTypeRegistry.types.length;
		context.functionTypeRegistry.signatureMap.set(signature, typeIndex);
		context.functionTypeRegistry.types.push(createFunctionType(params, results));
	}

	context.currentFunctionTypeIndex = typeIndex;

	return context;
};

export default functionEnd;
