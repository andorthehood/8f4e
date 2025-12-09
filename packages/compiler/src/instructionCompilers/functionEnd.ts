import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE, ArgumentType } from '../types';
import { isInstructionInsideFunction } from '../utils';

import type { InstructionCompiler } from '../types';

const functionEnd: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

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
	}

	// Clear the stack (return values are consumed)
	context.stack = [];

	return context;
};

export default functionEnd;
