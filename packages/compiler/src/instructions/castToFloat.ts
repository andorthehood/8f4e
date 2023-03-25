import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats } from '../utils';
import { ErrorCode, getError } from '../errors';

const castToFloat: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsFloats(operand)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	context.stack.push({ isInteger: false });
	return {
		byteCode: [WASMInstruction.F32_CONVERT_I32_S],
		context,
	};
};

export default castToFloat;
