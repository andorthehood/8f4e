import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const castToInt: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line, namespace, stack, blockStack);
	}

	stack.push({ isInteger: true });
	return {
		byteCode: [WASMInstruction.I32_TUNC_F32_S],
		namespace,
		stack,
		blockStack,
	};
};

export default castToInt;
