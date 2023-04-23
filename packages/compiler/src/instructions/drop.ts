import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const drop: InstructionHandler = function (line, context) {
	if (context.blockStack.length < 1) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	return { byteCode: [WASMInstruction.DROP], context };
};

export default drop;
