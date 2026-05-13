import { BlockType, compilerSourceBlockInstructionByType } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';
import { isInstructionInsideFunction, isInstructionIsInsideAModule } from '../utils/blockStack';

import type { CompilationContext, FunctionLine, InstructionCompiler } from '@8f4e/compiler-spec';

const functionBlockType = compilerSourceBlockInstructionByType.function.type;

// Note: This instruction does not use the shared instruction scope rule because it requires inverted scope validation:
// it must NOT be inside a module or function, which is the opposite of the standard scope rules
// that instruction specs support. The shared validator is designed for positive scope assertions
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
	context.codeBlockType = functionBlockType;
	context.currentFunctionSignature = {
		parameters: [],
		returns: [],
	};
	context.currentFunctionIsImpure = false;
	context.currentFunctionExportName = undefined;
	context.mode = functionBlockType;

	// Initialize empty locals - parameters will be added by param instructions
	context.locals = {};

	context.blockStack.push({
		blockType: BlockType.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
} as InstructionCompiler<FunctionLine>;

export default _function;
