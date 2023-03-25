import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const shiftRight: InstructionHandler = function (line, context) {
	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_SHR_S],
			context,
		};
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default shiftRight;
