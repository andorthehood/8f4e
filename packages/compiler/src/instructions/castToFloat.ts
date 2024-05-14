import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';

const castToFloat: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsFloats(operand)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
	return {
		byteCode: [WASMInstruction.F32_CONVERT_I32_S],
		context,
	};
};

export default castToFloat;
