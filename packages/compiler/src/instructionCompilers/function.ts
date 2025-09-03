import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';
import type { InstructionCompiler } from '../types';
import { BLOCK_TYPE } from '../types';

const _function: InstructionCompiler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return context;
};

export default _function;
