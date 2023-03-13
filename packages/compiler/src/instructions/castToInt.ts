import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const castToInt: InstructionHandler = function (line, namespace, stack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line);
	}

	if (areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line);
	}

	stack.push({ isInteger: true });
	return {
		byteCode: [WASMInstruction.I32_TUNC_F32_S],
		namespace,
		stack,
	};
};

export default castToInt;
