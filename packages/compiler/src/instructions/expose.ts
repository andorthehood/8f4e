import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAGroup } from '../utils';

const expose: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAGroup(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	// TODO

	return { byteCode: [], context };
};

export default expose;
