import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionInsideFunction } from '../utils';

import type { InstructionCompiler } from '../types';

const param: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	// Validate param comes immediately after function (no other function body instructions yet)
	// We check if there's any bytecode generated for the function body yet
	// The function instruction itself doesn't add body bytecode, so if there's any, it's from other instructions
	const currentBlock = context.blockStack[context.blockStack.length - 1];
	if (currentBlock?.blockType === BLOCK_TYPE.FUNCTION && context.loopSegmentByteCode.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const paramType = line.arguments[0].value;
	const paramName = line.arguments[1].value;

	if (paramType !== 'int' && paramType !== 'float') {
		throw getError(ErrorCode.INVALID_FUNCTION_SIGNATURE, line, context);
	}

	// Register parameter as a local variable with the given name
	// Parameters get local indices starting from 0
	const paramIndex = Object.keys(context.namespace.locals).length;

	context.namespace.locals[paramName] = {
		isInteger: paramType === 'int',
		index: paramIndex,
	};

	// Add parameter type to the function signature being built
	if (!context.currentFunctionSignature) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	context.currentFunctionSignature.parameters.push(paramType);

	if (context.currentFunctionSignature.parameters.length > 8) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}

	return context;
};

export default param;
