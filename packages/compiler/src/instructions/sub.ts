import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const sub: InstructionHandler = function (line, namespace, stack) {
	const operand1 = stack.pop();
	const operand2 = stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_SUB],
			namespace,
			stack,
		};
	} else if (areAllOperandsFloats(operand1, operand2)) {
		stack.push({ isInteger: false });
		return {
			byteCode: [WASMInstruction.F32_SUB],
			namespace,
			stack,
		};
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line);
	}
};

export default sub;
