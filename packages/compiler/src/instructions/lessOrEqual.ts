import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils';

const lessOrEqual: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand1 = stack.pop();
	const operand2 = stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		stack.push({ isInteger: true });
		return { byteCode: [WASMInstruction.I32_LE_S], namespace, stack, blockStack };
	} else if (areAllOperandsFloats(operand1, operand2)) {
		stack.push({ isInteger: true });
		return { byteCode: [WASMInstruction.F32_LE], namespace, stack, blockStack };
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, namespace, stack, blockStack);
	}
};

export default lessOrEqual;
