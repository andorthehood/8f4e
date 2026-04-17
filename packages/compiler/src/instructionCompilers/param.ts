import { ErrorCode, getError } from '../compilerError';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, ParamLine } from '../types';

/**
 * Instruction compiler for `param`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const param: InstructionCompiler<ParamLine> = withValidation<ParamLine>(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: ParamLine, context) => {
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
		const paramCount = context.currentFunctionSignature?.parameters.length || 0;
		const localCount = Object.keys(context.locals).length;

		if (localCount > paramCount || context.byteCode.length > 0) {
			throw getError(ErrorCode.PARAM_AFTER_FUNCTION_BODY, line, context);
		}

		const paramType = line.arguments[0].value as 'int' | 'float' | 'float64';
		const paramName = line.arguments[1].value;

		// Check for duplicate parameter names
		if (context.locals[paramName] !== undefined) {
			throw getError(ErrorCode.DUPLICATE_PARAMETER_NAME, line, context);
		}

		// Register parameter as a local variable with the given name
		// Parameters get local indices starting from 0
		const paramIndex = Object.keys(context.locals).length;

		context.locals[paramName] = {
			isInteger: paramType === 'int',
			...(paramType === 'float64' ? { isFloat64: true } : {}),
			index: paramIndex,
		};

		// Add parameter type to the function signature being built
		context.currentFunctionSignature!.parameters.push(paramType);

		if (context.currentFunctionSignature!.parameters.length > 8) {
			throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
		}

		return context;
	}
);

export default param;
