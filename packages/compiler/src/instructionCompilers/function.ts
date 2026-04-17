import { ErrorCode, getError } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import { isInstructionInsideFunction, isInstructionIsInsideAModule } from '../utils/blockStack';

import type { CompilationContext, FunctionLine, InstructionCompiler } from '../types';

// Note: This instruction does not use withValidation because it requires inverted scope validation:
// it must NOT be inside a module or function, which is the opposite of the standard scope rules
// that withValidation supports. The withValidation helper is designed for positive scope assertions
// (must be inside X), not negative ones (must NOT be inside X).

/**
 * Instruction compiler for `function`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const _function = function (line: FunctionLine, context: CompilationContext) {
	if (isInstructionIsInsideAModule(context.blockStack) || isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const functionId = line.arguments[0].value;

	context.currentFunctionId = functionId;
	context.codeBlockId = functionId;
	context.codeBlockType = 'function';
	context.currentFunctionSignature = {
		parameters: [],
		returns: [],
	};
	context.mode = 'function';

	// Initialize empty locals - parameters will be added by param instructions
	context.locals = {};

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
} as InstructionCompiler<FunctionLine>;

export default _function;
