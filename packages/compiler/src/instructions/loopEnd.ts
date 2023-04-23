import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const loopEnd: InstructionHandler = function (line, context) {
	if (context.blockStack.length < 1) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	return { byteCode: [...br(0), WASMInstruction.END], context };
};

export default loopEnd;
