import type { FunctionCodegenContext, FunctionValueType, InstructionCompiler, ParamLine } from '@8f4e/language-spec';
import { allocateLocalFromType } from '@8f4e/semantic-utils';

/**
 * Instruction compiler for `param`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
export function registerFunctionParameter(
	paramType: FunctionValueType,
	paramName: string,
	context: FunctionCodegenContext
): FunctionCodegenContext {
	allocateLocalFromType(context, paramName, paramType);
	context.currentFunctionParameterCount += 1;

	return context;
}

const param: InstructionCompiler<ParamLine, FunctionCodegenContext> = (line: ParamLine, context) => {
	return registerFunctionParameter(line.arguments[0].value as FunctionValueType, line.arguments[1].value, context);
};

export default param;
