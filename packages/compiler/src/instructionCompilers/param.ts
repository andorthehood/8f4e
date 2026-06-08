import type {
	CompilerASTLine,
	FunctionCodegenContext,
	FunctionValueType,
	InstructionCompiler,
	ParamLine,
} from '@8f4e/compiler-spec';
import { ErrorCode, MAX_FUNCTION_PARAMETERS } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';
import { functionValueTypeToLocalBinding } from '../utils/functionValueType';

/**
 * Instruction compiler for `param`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
export function registerFunctionParameter(
	paramType: FunctionValueType,
	paramName: string,
	line: CompilerASTLine,
	context: FunctionCodegenContext
): FunctionCodegenContext {
	// Validate param comes immediately after function (before any non-param locals or bytecode)
	//
	// Parameters must be declared before any other function body code:
	// - Parameters are registered as locals at indices 0, 1, 2, etc. in order
	// - The 'local' instruction also registers locals but should come after all params
	// - Other instructions generate bytecode in byteCode
	//
	// We validate this by checking:
	// 1. localCount > paramCount: means a non-param local was declared (via 'local' instruction)
	// 2. byteCode.length > 0: means other instructions have already run
	//
	// If either is true, we're past the param declaration phase and should error.
	const paramCount = context.currentFunctionParameterCount;
	const localCount = Object.keys(context.locals).length;

	if (localCount > paramCount || context.byteCode.length > 0) {
		throw getError(ErrorCode.PARAM_AFTER_FUNCTION_BODY, line, context);
	}

	// Check for duplicate parameter names
	if (context.locals[paramName] !== undefined) {
		throw getError(ErrorCode.DUPLICATE_PARAMETER_NAME, line, context);
	}

	// Register parameter as a local variable with the given name
	// Parameters get local indices starting from 0
	const paramIndex = Object.keys(context.locals).length;

	context.locals[paramName] = functionValueTypeToLocalBinding(paramType, paramIndex);

	context.currentFunctionParameterCount += 1;

	if (context.currentFunctionParameterCount > MAX_FUNCTION_PARAMETERS) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}

	return context;
}

const param: InstructionCompiler<ParamLine, FunctionCodegenContext> = (line: ParamLine, context) => {
	return registerFunctionParameter(
		line.arguments[0].value as FunctionValueType,
		line.arguments[1].value,
		line,
		context
	);
};

export default param;
