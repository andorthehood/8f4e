import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats } from '../utils';
import { ErrorCode, getError } from '../errors';

const castToFloat: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsFloats(operand)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, namespace, stack, blockStack);
	}

	stack.push({ isInteger: false });
	return {
		byteCode: [WASMInstruction.F32_CONVERT_I32_S],
		namespace,
		stack,
		blockStack,
	};
};

export default castToFloat;
