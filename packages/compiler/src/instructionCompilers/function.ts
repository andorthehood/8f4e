import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';
import { BLOCK_TYPE, InstructionHandler } from '../types';

const _function: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	context.blockStack.push({
		blockType: BLOCK_TYPE.FUNCTION,
		expectedResultIsInteger: false,
		hasExpectedResult: false,
	});

	return { byteCode: [], context };
};

export default _function;
