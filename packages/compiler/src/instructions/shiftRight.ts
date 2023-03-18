import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const shiftRight: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand1 = stack.pop();
	const operand2 = stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_SHR_S],
			namespace,
			stack,
			blockStack,
		};
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, namespace, stack, blockStack);
	}
};

export default shiftRight;
