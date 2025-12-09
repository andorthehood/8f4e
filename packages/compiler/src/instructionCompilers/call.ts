import { ErrorCode, getError } from '../errors';
import { ArgumentType } from '../types';
import { isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import { call as wasmCall } from '../wasmUtils/instructionHelpers';

import type { InstructionCompiler } from '../types';

const call: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const functionNameArg = line.arguments[0];
	if (!functionNameArg || functionNameArg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	const functionName = functionNameArg.value;
	const targetFunction = context.namespace.functions?.[functionName];

	if (!targetFunction) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}

	// Validate stack has the right arguments
	const { parameters, returns } = targetFunction.signature;
	if (context.stack.length < parameters.length) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	// Check parameter types match
	for (let i = 0; i < parameters.length; i++) {
		const stackIndex = context.stack.length - parameters.length + i;
		const stackItem = context.stack[stackIndex];
		const expectedInteger = parameters[i] === 'int';
		if (stackItem.isInteger !== expectedInteger) {
			throw getError(ErrorCode.TYPE_MISMATCH, line, context);
		}
	}

	// Pop arguments from stack
	context.stack.splice(context.stack.length - parameters.length, parameters.length);

	// Push return values onto stack
	returns.forEach(returnType => {
		context.stack.push({ isInteger: returnType === 'int' });
	});

	// Emit WASM call instruction
	if (targetFunction.wasmIndex !== undefined) {
		saveByteCode(context, wasmCall(targetFunction.wasmIndex));
	}

	return context;
};

export default call;
