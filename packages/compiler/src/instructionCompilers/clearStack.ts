import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';

const clearStack: InstructionHandler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const length = context.stack.length;
	context.stack = [];
	return { byteCode: new Array(length).fill(WASMInstruction.DROP), context };
};

export default clearStack;
