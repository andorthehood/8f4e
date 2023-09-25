import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';

const sqrt: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();

	if (!operand1) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operand1.isInteger) {
		throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line, context);
	}

	context.stack.push({ isInteger: false });

	return {
		byteCode: [WASMInstruction.F32_SQRT],
		context,
	};
};

export default sqrt;
