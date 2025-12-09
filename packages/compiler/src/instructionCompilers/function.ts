import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule, isInstructionInsideFunction } from '../utils';
import { BLOCK_TYPE, ArgumentType } from '../types';

import type { InstructionCompiler } from '../types';

const _function: InstructionCompiler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack) || isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	// Parse function signature: function <name> [<argType1> <argType2> ...]
	const nameArg = line.arguments[0];
	if (!nameArg || nameArg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, line, context);
	}

	const functionId = nameArg.value;
	const paramTypes = line.arguments.slice(1).map(arg => {
		if (arg.type !== ArgumentType.IDENTIFIER || (arg.value !== 'int' && arg.value !== 'float')) {
			throw getError(ErrorCode.INVALID_FUNCTION_SIGNATURE, line, context);
		}
		return arg.value as 'int' | 'float';
	});

	if (paramTypes.length > 8) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}

	context.currentFunctionId = functionId;
	context.currentFunctionSignature = {
		parameters: paramTypes,
		returns: [],
	};
	context.mode = 'function';

	// Initialize locals for parameters
	context.namespace.locals = {};
	paramTypes.forEach((type, index) => {
		context.namespace.locals[`param${index}`] = {
			isInteger: type === 'int',
			index,
		};
	});

	// Push parameters onto the stack (they're implicitly available in WASM)
	paramTypes.forEach(type => {
		context.stack.push({ isInteger: type === 'int' });
	});

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
};

export default _function;
