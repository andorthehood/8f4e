import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import { isInstructionIsInsideAModule } from '../utils';

const moduleEnd: InstructionHandler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || !block.isModuleBlock) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	return { byteCode: [], context };
};

export default moduleEnd;
