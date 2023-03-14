import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats } from '../utils';
import { ErrorCode, getError } from '../errors';

const castToFloat: InstructionHandler = function (line, namespace, stack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line);
	}

	if (areAllOperandsFloats(operand)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line);
	}

	stack.push({ isInteger: false });
	return {
		byteCode: [WASMInstruction.F32_CONVERT_I32_S],
		namespace,
		stack,
	};
};

export default castToFloat;
