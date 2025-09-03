import { ErrorCode, getError } from '../errors';
import type { InstructionCompiler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule, saveByteCode } from '../utils';

const drop: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	return saveByteCode(context, [WASMInstruction.DROP]);
};

export default drop;
