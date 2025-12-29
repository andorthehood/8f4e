import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule, isInstructionInsideFunction } from '../utils';
import { BLOCK_TYPE, ArgumentType } from '../types';

import type { InstructionCompiler } from '../types';

// Note: This instruction does not use withValidation because it requires inverted scope validation:
// it must NOT be inside a module or function, which is the opposite of the standard scope rules
// that withValidation supports. The withValidation helper is designed for positive scope assertions
// (must be inside X), not negative ones (must NOT be inside X).

/**
 * Instruction compiler for `function`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const _function: InstructionCompiler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack) || isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	// Parse function name: function <name>
	const nameArg = line.arguments[0];
	if (!nameArg || nameArg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, line, context);
	}

	const functionId = nameArg.value;

	context.currentFunctionId = functionId;
	context.currentFunctionSignature = {
		parameters: [],
		returns: [],
	};
	context.mode = 'function';

	// Initialize empty locals - parameters will be added by param instructions
	context.namespace.locals = {};

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
};

export default _function;
