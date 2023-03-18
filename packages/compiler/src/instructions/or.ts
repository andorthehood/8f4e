import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers } from '../utils';

const or: InstructionHandler = function (line, namespace, stack) {
	const operand1 = stack.pop();
	const operand2 = stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_OR],
			namespace,
			stack,
		};
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, namespace, stack);
	}
};

export default or;
