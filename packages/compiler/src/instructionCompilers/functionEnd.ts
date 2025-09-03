import { ErrorCode, getError } from '../errors';
import type { InstructionCompiler } from '../types';
import { BLOCK_TYPE } from '../types';
import { isInstructionIsInsideAModule } from '../utils';

const functionEnd: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.FUNCTION) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	const operand = context.stack.pop();

	if (operand) {
		throw getError(ErrorCode.STACK_EXPECTED_ZERO_ELEMENTS, line, context);
	}

	return context;
};

export default functionEnd;
