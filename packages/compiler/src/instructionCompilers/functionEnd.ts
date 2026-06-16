import type { CompilerASTLine, FunctionCodegenContext, InstructionCompiler } from '@8f4e/language-spec';
import { popBlock } from '../utils/blockStack';
import { functionValueTypeToWasmType } from '../utils/functionValueType';
import { getOrRegisterFunctionType } from './utils/functionTypeRegistry';

/**
 * Instruction compiler for `functionEnd`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const functionEnd: InstructionCompiler<CompilerASTLine, FunctionCodegenContext> = (line, context) => {
	popBlock(context);

	// Register type signature in the type registry
	const params = context.currentFunctionMetadata.signature.parameters.map(functionValueTypeToWasmType);
	const results = context.currentFunctionMetadata.signature.returns.map(functionValueTypeToWasmType);

	context.currentFunctionTypeIndex = getOrRegisterFunctionType(context.functionTypeRegistry, { params, results });

	return context;
};

export default functionEnd;
