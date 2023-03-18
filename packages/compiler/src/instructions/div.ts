import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils';
import { ErrorCode } from '../errors';
import { getError } from '../errors';

const div: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand1 = stack.pop();
	const operand2 = stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		stack.push({ isInteger: true });
		return { byteCode: [WASMInstruction.I32_DIV_S], namespace, stack, blockStack };
	} else if (areAllOperandsFloats(operand1, operand2)) {
		stack.push({ isInteger: false });
		return { byteCode: [WASMInstruction.F32_DIV], namespace, stack, blockStack };
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, namespace, stack, blockStack);
	}
};

export default div;
