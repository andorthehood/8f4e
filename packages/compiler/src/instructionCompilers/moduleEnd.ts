import { ErrorCode, getError } from '../errors';
import { BLOCK_TYPE, InstructionHandler } from '../types';
import { isInstructionIsInsideAModule } from '../utils';

const moduleEnd: InstructionHandler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	return { byteCode: [], context };
};

export default moduleEnd;
